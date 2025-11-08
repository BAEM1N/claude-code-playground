"""
Jupyter Kernel Execution Service
Handles code execution via Jupyter Kernel Gateway

This service provides:
- Code execution in isolated kernels
- Multiple kernel support (Python, JavaScript, SQL)
- Output streaming
- Error handling
- Resource limits
- Execution timeout

Setup Required:
1. Install Jupyter Kernel Gateway:
   pip install jupyter_kernel_gateway nbformat jupyter_client

2. Start Kernel Gateway (development):
   jupyter kernelgateway --KernelGatewayApp.ip='0.0.0.0' --KernelGatewayApp.port=8888

3. Start Kernel Gateway (production with Docker):
   docker run -p 8888:8888 jupyter/kernel-gateway

Configuration:
- JUPYTER_GATEWAY_URL: URL of Jupyter Kernel Gateway (default: http://localhost:8888)
- JUPYTER_TIMEOUT: Maximum execution time in seconds (default: 30)
- JUPYTER_MAX_OUTPUT_SIZE: Maximum output size in bytes (default: 1MB)
"""

import os
import json
import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from .code_validator import validate_code_safety

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class JupyterExecutionService:
    """Service for executing code via Jupyter Kernel Gateway"""

    def __init__(self):
        self.gateway_url = os.getenv("JUPYTER_GATEWAY_URL", "http://localhost:8888")
        self.timeout = int(os.getenv("JUPYTER_TIMEOUT", "30"))
        # Reduced from 1MB to 100KB for better security and performance
        self.max_output_size = int(os.getenv("JUPYTER_MAX_OUTPUT_SIZE", str(100 * 1024)))  # 100KB

        # Kernel management
        self.active_kernels: Dict[str, str] = {}  # topic_id -> kernel_id mapping
        self.kernel_created_at: Dict[str, datetime] = {}  # kernel_id -> creation time
        self.kernel_last_used: Dict[str, datetime] = {}  # kernel_id -> last used time

        # Limits and TTL
        self.max_kernels = int(os.getenv("MAX_KERNELS", "100"))  # Maximum active kernels
        self.kernel_ttl = int(os.getenv("KERNEL_TTL_SECONDS", "3600"))  # 1 hour
        self.kernel_idle_timeout = int(os.getenv("KERNEL_IDLE_TIMEOUT", "1800"))  # 30 minutes

    async def execute_code(
        self,
        code: str,
        kernel_type: str = "python3",
        topic_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute code in a Jupyter kernel

        Args:
            code: Code to execute
            kernel_type: Kernel type (python3, javascript, sql, etc.)
            topic_id: Optional topic ID for kernel reuse
            user_id: Optional user ID for tracking

        Returns:
            Dict with execution result:
            {
                "output": str,  # Standard output
                "error": Optional[str],  # Error message if any
                "execution_status": str,  # "success", "error", "timeout"
                "execution_time_ms": int,  # Execution time in milliseconds
                "executed_at": str  # ISO timestamp
            }
        """
        start_time = datetime.now()
        logger.info(f"Executing code for user={user_id}, topic={topic_id}, kernel={kernel_type}")

        try:
            # Validate code for security issues
            try:
                validate_code_safety(code, kernel_type)
            except ValueError as e:
                logger.warning(f"Code validation failed for user={user_id}: {e}")
                return {
                    "output": None,
                    "error": f"Security validation failed: {e}",
                    "execution_status": "forbidden",
                    "execution_time_ms": 0,
                    "executed_at": datetime.utcnow().isoformat()
                }

            # Get or create kernel
            kernel_id = await self._get_or_create_kernel(kernel_type, topic_id)
            logger.debug(f"Using kernel {kernel_id} for execution")

            # Execute code
            result = await self._execute_in_kernel(kernel_id, code)

            # Calculate execution time
            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            execution_result = {
                "output": result.get("output", ""),
                "error": result.get("error"),
                "execution_status": result.get("status", "success"),
                "execution_time_ms": execution_time_ms,
                "executed_at": datetime.utcnow().isoformat()
            }

            if result.get("status") == "error":
                logger.warning(f"Code execution failed for user={user_id}: {result.get('error')}")
            else:
                logger.info(f"Code execution succeeded for user={user_id} in {execution_time_ms}ms")

            return execution_result

        except asyncio.TimeoutError:
            logger.error(f"Execution timed out after {self.timeout}s for user={user_id}")
            return {
                "output": None,
                "error": f"Execution timed out after {self.timeout} seconds",
                "execution_status": "timeout",
                "execution_time_ms": self.timeout * 1000,
                "executed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error during execution for user={user_id}: {type(e).__name__}: {e}", exc_info=True)
            return {
                "output": None,
                "error": str(e),
                "execution_status": "error",
                "execution_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "executed_at": datetime.utcnow().isoformat()
            }

    async def _cleanup_old_kernels(self):
        """Cleanup old and idle kernels to prevent resource exhaustion"""
        now = datetime.now()
        kernels_to_remove = []

        # Find kernels to remove
        for topic_id, kernel_id in self.active_kernels.items():
            created_at = self.kernel_created_at.get(kernel_id)
            last_used = self.kernel_last_used.get(kernel_id, created_at)

            # Remove if kernel exceeded TTL
            if created_at and (now - created_at).total_seconds() > self.kernel_ttl:
                logger.info(f"Kernel {kernel_id} exceeded TTL ({self.kernel_ttl}s), shutting down")
                kernels_to_remove.append((topic_id, kernel_id, "ttl_exceeded"))
                continue

            # Remove if kernel is idle too long
            if last_used and (now - last_used).total_seconds() > self.kernel_idle_timeout:
                logger.info(f"Kernel {kernel_id} idle for {self.kernel_idle_timeout}s, shutting down")
                kernels_to_remove.append((topic_id, kernel_id, "idle_timeout"))
                continue

        # Shutdown and remove kernels
        for topic_id, kernel_id, reason in kernels_to_remove:
            await self.shutdown_kernel(kernel_id)
            if topic_id in self.active_kernels:
                del self.active_kernels[topic_id]
            if kernel_id in self.kernel_created_at:
                del self.kernel_created_at[kernel_id]
            if kernel_id in self.kernel_last_used:
                del self.kernel_last_used[kernel_id]

        if kernels_to_remove:
            logger.info(f"Cleaned up {len(kernels_to_remove)} kernels")

    async def _get_or_create_kernel(self, kernel_type: str, topic_id: Optional[str]) -> str:
        """Get existing kernel or create a new one"""
        # Cleanup old kernels periodically
        await self._cleanup_old_kernels()

        # Reuse kernel for the same topic
        if topic_id and topic_id in self.active_kernels:
            kernel_id = self.active_kernels[topic_id]
            # Verify kernel is still alive
            if await self._is_kernel_alive(kernel_id):
                # Update last used time
                self.kernel_last_used[kernel_id] = datetime.now()
                logger.debug(f"Reusing kernel {kernel_id} for topic {topic_id}")
                return kernel_id
            else:
                # Kernel is dead, remove it
                logger.warning(f"Kernel {kernel_id} is not alive, removing from cache")
                del self.active_kernels[topic_id]
                if kernel_id in self.kernel_created_at:
                    del self.kernel_created_at[kernel_id]
                if kernel_id in self.kernel_last_used:
                    del self.kernel_last_used[kernel_id]

        # Check kernel limit before creating new one
        if len(self.active_kernels) >= self.max_kernels:
            logger.error(f"Maximum kernel limit reached: {self.max_kernels}")
            raise Exception(
                f"Maximum kernel limit ({self.max_kernels}) reached. "
                "Please try again later or contact support."
            )

        # Create new kernel
        kernel_id = await self._create_kernel(kernel_type)
        now = datetime.now()
        self.kernel_created_at[kernel_id] = now
        self.kernel_last_used[kernel_id] = now

        if topic_id:
            self.active_kernels[topic_id] = kernel_id

        return kernel_id

    async def _create_kernel(self, kernel_type: str) -> str:
        """Create a new Jupyter kernel"""
        logger.info(f"Creating new kernel of type: {kernel_type}")
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.gateway_url}/api/kernels"
                payload = {"name": kernel_type}

                async with session.post(url, json=payload, timeout=10) as response:
                    if response.status != 201:
                        error_text = await response.text()
                        logger.error(f"Failed to create kernel {kernel_type}: status={response.status}, error={error_text}")
                        raise Exception(f"Failed to create kernel: {response.status} - {error_text}")

                    data = await response.json()
                    kernel_id = data["id"]
                    logger.info(f"Successfully created kernel {kernel_id} of type {kernel_type}")
                    return kernel_id
        except aiohttp.ClientError as e:
            logger.error(f"Network error creating kernel {kernel_type}: {type(e).__name__}: {e}")
            raise Exception(f"Network error creating kernel: {e}")
        except asyncio.TimeoutError:
            logger.error(f"Timeout creating kernel {kernel_type}")
            raise Exception("Timeout creating kernel")
        except Exception as e:
            logger.error(f"Unexpected error creating kernel {kernel_type}: {type(e).__name__}: {e}")
            raise

    async def _is_kernel_alive(self, kernel_id: str) -> bool:
        """Check if kernel is still alive"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.gateway_url}/api/kernels/{kernel_id}"
                async with session.get(url, timeout=5) as response:
                    is_alive = response.status == 200
                    if not is_alive:
                        logger.debug(f"Kernel {kernel_id} status check returned {response.status}")
                    return is_alive
        except aiohttp.ClientError as e:
            logger.warning(f"Failed to check kernel {kernel_id}: {type(e).__name__}: {e}")
            return False
        except asyncio.TimeoutError:
            logger.warning(f"Timeout checking kernel {kernel_id}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking kernel {kernel_id}: {type(e).__name__}: {e}")
            return False

    async def _execute_in_kernel(self, kernel_id: str, code: str) -> Dict[str, Any]:
        """Execute code in a specific kernel"""
        async with aiohttp.ClientSession() as session:
            # Create execution request
            url = f"{self.gateway_url}/api/kernels/{kernel_id}/execute"

            # Jupyter message format
            msg = {
                "code": code,
                "silent": False,
                "store_history": True,
                "user_expressions": {},
                "allow_stdin": False
            }

            try:
                async with session.post(
                    url,
                    json=msg,
                    timeout=self.timeout
                ) as response:
                    if response.status != 200:
                        return {
                            "output": None,
                            "error": f"Execution failed with status {response.status}",
                            "status": "error"
                        }

                    result = await response.json()
                    return self._parse_execution_result(result)

            except asyncio.TimeoutError:
                raise
            except Exception as e:
                return {
                    "output": None,
                    "error": str(e),
                    "status": "error"
                }

    def _parse_execution_result(self, result: Dict) -> Dict[str, Any]:
        """Parse Jupyter execution result"""
        output_lines = []
        error_lines = []

        try:
            # Safely access nested dictionary
            content = result.get("content")
            if not content or not isinstance(content, dict):
                logger.warning(f"Invalid result format: missing or invalid 'content' field")
                return {
                    "output": None,
                    "error": "Invalid execution result format",
                    "status": "error"
                }

            outputs = content.get("outputs", [])
            if not isinstance(outputs, list):
                logger.warning(f"Invalid result format: 'outputs' is not a list")
                outputs = []

            # Parse different message types
            for msg in outputs:
                if not isinstance(msg, dict):
                    continue

                msg_type = msg.get("output_type")

                if msg_type == "stream":
                    # Standard output/error
                    text = msg.get("text", "")
                    if isinstance(text, list):
                        text = "".join(text)
                    output_lines.append(str(text))

                elif msg_type == "execute_result" or msg_type == "display_data":
                    # Execution result or display
                    data = msg.get("data", {})
                    if isinstance(data, dict) and "text/plain" in data:
                        text = data["text/plain"]
                        if isinstance(text, list):
                            text = "".join(text)
                        output_lines.append(str(text))

                elif msg_type == "error":
                    # Error output
                    ename = msg.get("ename", "Error")
                    evalue = msg.get("evalue", "")
                    traceback = msg.get("traceback", [])
                    error_lines.append(f"{ename}: {evalue}")
                    if isinstance(traceback, list):
                        error_lines.extend(str(line) for line in traceback)

            # Combine outputs
            output = "\n".join(output_lines) if output_lines else None
            error = "\n".join(error_lines) if error_lines else None

            # Truncate if too large
            if output and len(output) > self.max_output_size:
                output = output[:self.max_output_size] + "\n... (output truncated)"
                logger.warning(f"Output truncated: exceeded {self.max_output_size} bytes")

            if error and len(error) > self.max_output_size:
                error = error[:self.max_output_size] + "\n... (error truncated)"
                logger.warning(f"Error output truncated: exceeded {self.max_output_size} bytes")

            return {
                "output": output,
                "error": error,
                "status": "error" if error else "success"
            }
        except Exception as e:
            logger.error(f"Error parsing execution result: {type(e).__name__}: {e}", exc_info=True)
            return {
                "output": None,
                "error": f"Failed to parse execution result: {e}",
                "status": "error"
            }

    async def shutdown_kernel(self, kernel_id: str) -> bool:
        """Shutdown a specific kernel"""
        logger.info(f"Shutting down kernel {kernel_id}")
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.gateway_url}/api/kernels/{kernel_id}"
                async with session.delete(url, timeout=5) as response:
                    success = response.status == 204
                    if success:
                        logger.info(f"Successfully shut down kernel {kernel_id}")
                    else:
                        logger.warning(f"Failed to shut down kernel {kernel_id}: status={response.status}")
                    return success
        except aiohttp.ClientError as e:
            logger.error(f"Network error shutting down kernel {kernel_id}: {type(e).__name__}: {e}")
            return False
        except asyncio.TimeoutError:
            logger.error(f"Timeout shutting down kernel {kernel_id}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error shutting down kernel {kernel_id}: {type(e).__name__}: {e}")
            return False

    async def shutdown_topic_kernel(self, topic_id: str):
        """Shutdown kernel associated with a topic"""
        if topic_id in self.active_kernels:
            kernel_id = self.active_kernels[topic_id]
            await self.shutdown_kernel(kernel_id)
            del self.active_kernels[topic_id]

    async def shutdown_all_kernels(self):
        """Shutdown all active kernels"""
        for kernel_id in list(self.active_kernels.values()):
            await self.shutdown_kernel(kernel_id)
        self.active_kernels.clear()


# Simple in-memory execution fallback (for development without Kernel Gateway)
class SimpleExecutionService:
    """
    Simple code execution service for development
    WARNING: This executes code directly - only use for trusted code in development!
    """

    async def execute_code(
        self,
        code: str,
        kernel_type: str = "python3",
        topic_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute code using subprocess (Python only)"""
        import subprocess
        import sys

        logger.warning(f"Using SimpleExecutionService (development only) for user={user_id}, topic={topic_id}")
        start_time = datetime.now()

        if kernel_type != "python3":
            logger.error(f"Unsupported kernel type in simple mode: {kernel_type}")
            return {
                "output": None,
                "error": f"Kernel type '{kernel_type}' not supported in simple mode. Only Python is supported.",
                "execution_status": "error",
                "execution_time_ms": 0,
                "executed_at": datetime.utcnow().isoformat()
            }

        # Validate code for security issues
        try:
            validate_code_safety(code, kernel_type)
        except ValueError as e:
            logger.warning(f"Code validation failed in simple execution for user={user_id}: {e}")
            return {
                "output": None,
                "error": f"Security validation failed: {e}",
                "execution_status": "forbidden",
                "execution_time_ms": 0,
                "executed_at": datetime.utcnow().isoformat()
            }

        try:
            # Execute code in subprocess
            logger.debug(f"Executing code via subprocess for user={user_id}")
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=30,
                check=False
            )

            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            if result.returncode == 0:
                logger.info(f"Simple execution succeeded for user={user_id} in {execution_time_ms}ms")
                return {
                    "output": result.stdout or "(no output)",
                    "error": None,
                    "execution_status": "success",
                    "execution_time_ms": execution_time_ms,
                    "executed_at": datetime.utcnow().isoformat()
                }
            else:
                logger.warning(f"Simple execution failed for user={user_id}: {result.stderr}")
                return {
                    "output": result.stdout or None,
                    "error": result.stderr or "Execution failed",
                    "execution_status": "error",
                    "execution_time_ms": execution_time_ms,
                    "executed_at": datetime.utcnow().isoformat()
                }

        except subprocess.TimeoutExpired:
            logger.error(f"Simple execution timed out for user={user_id}")
            return {
                "output": None,
                "error": "Execution timed out after 30 seconds",
                "execution_status": "timeout",
                "execution_time_ms": 30000,
                "executed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error in simple execution for user={user_id}: {type(e).__name__}: {e}", exc_info=True)
            return {
                "output": None,
                "error": str(e),
                "execution_status": "error",
                "execution_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "executed_at": datetime.utcnow().isoformat()
            }


# Global service instance
_jupyter_service = None
_simple_service = None


def get_jupyter_service() -> JupyterExecutionService:
    """Get or create Jupyter execution service instance"""
    global _jupyter_service
    if _jupyter_service is None:
        _jupyter_service = JupyterExecutionService()
    return _jupyter_service


def get_simple_service() -> SimpleExecutionService:
    """Get or create simple execution service instance (fallback)"""
    global _simple_service
    if _simple_service is None:
        _simple_service = SimpleExecutionService()
    return _simple_service


async def execute_code(
    code: str,
    kernel_type: str = "python3",
    topic_id: Optional[str] = None,
    user_id: Optional[str] = None,
    use_simple: bool = False
) -> Dict[str, Any]:
    """
    Execute code using appropriate service

    Args:
        code: Code to execute
        kernel_type: Kernel type (python3, javascript, sql)
        topic_id: Optional topic ID for kernel reuse
        user_id: Optional user ID for tracking
        use_simple: Use simple subprocess execution (development only)

    Returns:
        Execution result dictionary
    """
    if use_simple or os.getenv("JUPYTER_USE_SIMPLE", "false").lower() == "true":
        service = get_simple_service()
    else:
        service = get_jupyter_service()

    return await service.execute_code(code, kernel_type, topic_id, user_id)
