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
from typing import Optional, Dict, Any
from datetime import datetime


class JupyterExecutionService:
    """Service for executing code via Jupyter Kernel Gateway"""

    def __init__(self):
        self.gateway_url = os.getenv("JUPYTER_GATEWAY_URL", "http://localhost:8888")
        self.timeout = int(os.getenv("JUPYTER_TIMEOUT", "30"))
        self.max_output_size = int(os.getenv("JUPYTER_MAX_OUTPUT_SIZE", str(1024 * 1024)))  # 1MB
        self.active_kernels: Dict[str, str] = {}  # topic_id -> kernel_id mapping

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

        try:
            # Get or create kernel
            kernel_id = await self._get_or_create_kernel(kernel_type, topic_id)

            # Execute code
            result = await self._execute_in_kernel(kernel_id, code)

            # Calculate execution time
            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            return {
                "output": result.get("output", ""),
                "error": result.get("error"),
                "execution_status": result.get("status", "success"),
                "execution_time_ms": execution_time_ms,
                "executed_at": datetime.utcnow().isoformat()
            }

        except asyncio.TimeoutError:
            return {
                "output": None,
                "error": f"Execution timed out after {self.timeout} seconds",
                "execution_status": "timeout",
                "execution_time_ms": self.timeout * 1000,
                "executed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "output": None,
                "error": str(e),
                "execution_status": "error",
                "execution_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "executed_at": datetime.utcnow().isoformat()
            }

    async def _get_or_create_kernel(self, kernel_type: str, topic_id: Optional[str]) -> str:
        """Get existing kernel or create a new one"""
        # Reuse kernel for the same topic
        if topic_id and topic_id in self.active_kernels:
            kernel_id = self.active_kernels[topic_id]
            # Verify kernel is still alive
            if await self._is_kernel_alive(kernel_id):
                return kernel_id

        # Create new kernel
        kernel_id = await self._create_kernel(kernel_type)

        if topic_id:
            self.active_kernels[topic_id] = kernel_id

        return kernel_id

    async def _create_kernel(self, kernel_type: str) -> str:
        """Create a new Jupyter kernel"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.gateway_url}/api/kernels"
            payload = {"name": kernel_type}

            async with session.post(url, json=payload, timeout=10) as response:
                if response.status != 201:
                    raise Exception(f"Failed to create kernel: {response.status}")

                data = await response.json()
                return data["id"]

    async def _is_kernel_alive(self, kernel_id: str) -> bool:
        """Check if kernel is still alive"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.gateway_url}/api/kernels/{kernel_id}"
                async with session.get(url, timeout=5) as response:
                    return response.status == 200
        except:
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

        # Parse different message types
        for msg in result.get("content", {}).get("outputs", []):
            msg_type = msg.get("output_type")

            if msg_type == "stream":
                # Standard output/error
                text = msg.get("text", "")
                if isinstance(text, list):
                    text = "".join(text)
                output_lines.append(text)

            elif msg_type == "execute_result" or msg_type == "display_data":
                # Execution result or display
                data = msg.get("data", {})
                if "text/plain" in data:
                    text = data["text/plain"]
                    if isinstance(text, list):
                        text = "".join(text)
                    output_lines.append(text)

            elif msg_type == "error":
                # Error output
                ename = msg.get("ename", "Error")
                evalue = msg.get("evalue", "")
                traceback = msg.get("traceback", [])
                error_lines.append(f"{ename}: {evalue}")
                if traceback:
                    error_lines.extend(traceback)

        # Combine outputs
        output = "\n".join(output_lines) if output_lines else None
        error = "\n".join(error_lines) if error_lines else None

        # Truncate if too large
        if output and len(output) > self.max_output_size:
            output = output[:self.max_output_size] + "\n... (output truncated)"

        if error and len(error) > self.max_output_size:
            error = error[:self.max_output_size] + "\n... (error truncated)"

        return {
            "output": output,
            "error": error,
            "status": "error" if error else "success"
        }

    async def shutdown_kernel(self, kernel_id: str):
        """Shutdown a specific kernel"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.gateway_url}/api/kernels/{kernel_id}"
                async with session.delete(url, timeout=5) as response:
                    return response.status == 204
        except:
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

        start_time = datetime.now()

        if kernel_type != "python3":
            return {
                "output": None,
                "error": f"Kernel type '{kernel_type}' not supported in simple mode. Only Python is supported.",
                "execution_status": "error",
                "execution_time_ms": 0,
                "executed_at": datetime.utcnow().isoformat()
            }

        try:
            # Execute code in subprocess
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=30,
                check=False
            )

            execution_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            if result.returncode == 0:
                return {
                    "output": result.stdout or "(no output)",
                    "error": None,
                    "execution_status": "success",
                    "execution_time_ms": execution_time_ms,
                    "executed_at": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "output": result.stdout or None,
                    "error": result.stderr or "Execution failed",
                    "execution_status": "error",
                    "execution_time_ms": execution_time_ms,
                    "executed_at": datetime.utcnow().isoformat()
                }

        except subprocess.TimeoutExpired:
            return {
                "output": None,
                "error": "Execution timed out after 30 seconds",
                "execution_status": "timeout",
                "execution_time_ms": 30000,
                "executed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
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
