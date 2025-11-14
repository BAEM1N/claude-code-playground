"""
Code execution service with sandboxing
WARNING: This is a simplified implementation for demonstration purposes.
For production, use Docker containers or dedicated code execution services.
"""
import subprocess
import tempfile
import os
import time
import signal
import resource
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class CodeExecutor:
    """Service for executing code in a sandboxed environment"""

    # Language configurations
    LANGUAGE_CONFIG = {
        "python": {
            "extension": "py",
            "command": ["python3", "{file}"],
            "timeout": 5,
        },
        "javascript": {
            "extension": "js",
            "command": ["node", "{file}"],
            "timeout": 5,
        },
        "java": {
            "extension": "java",
            "command": ["java", "{file}"],
            "compile_command": ["javac", "{file}"],
            "timeout": 10,
        },
        "cpp": {
            "extension": "cpp",
            "command": ["./{executable}"],
            "compile_command": ["g++", "{file}", "-o", "{executable}"],
            "timeout": 10,
        },
        "c": {
            "extension": "c",
            "command": ["./{executable}"],
            "compile_command": ["gcc", "{file}", "-o", "{executable}"],
            "timeout": 10,
        },
    }

    # Starter code templates
    STARTER_TEMPLATES = {
        "python": """def solution():
    # Write your code here
    pass

if __name__ == "__main__":
    result = solution()
    print(result)
""",
        "javascript": """function solution() {
    // Write your code here
}

console.log(solution());
""",
        "java": """public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello World");
    }
}
""",
        "cpp": """#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello World" << endl;
    return 0;
}
""",
        "c": """#include <stdio.h>

int main() {
    // Write your code here
    printf("Hello World\\n");
    return 0;
}
""",
    }

    @staticmethod
    def get_starter_code(language: str) -> str:
        """Get starter code template for a language"""
        return CodeExecutor.STARTER_TEMPLATES.get(language, "")

    @staticmethod
    def execute_code(
        code: str,
        language: str,
        input_data: Optional[str] = None,
        time_limit: int = 5,
        memory_limit: int = 128,
    ) -> Dict:
        """
        Execute code in a sandboxed environment

        Args:
            code: Source code to execute
            language: Programming language
            input_data: Input for the program (stdin)
            time_limit: Maximum execution time in seconds
            memory_limit: Maximum memory in MB

        Returns:
            Dict with execution results
        """
        if language not in CodeExecutor.LANGUAGE_CONFIG:
            return {
                "status": "error",
                "error": f"Unsupported language: {language}",
                "output": None,
                "execution_time": 0,
                "memory_used": 0,
            }

        config = CodeExecutor.LANGUAGE_CONFIG[language]
        extension = config["extension"]
        timeout = min(time_limit, config["timeout"])

        try:
            # Create temporary directory for execution
            with tempfile.TemporaryDirectory() as tmpdir:
                # Write code to file
                if language == "java":
                    # Extract class name for Java
                    class_name = "Solution"  # Default
                    if "public class" in code:
                        lines = code.split("\n")
                        for line in lines:
                            if "public class" in line:
                                parts = line.split()
                                idx = parts.index("class") + 1
                                if idx < len(parts):
                                    class_name = parts[idx].strip("{").strip()
                                break
                    filename = f"{class_name}.{extension}"
                else:
                    filename = f"solution.{extension}"

                filepath = os.path.join(tmpdir, filename)

                with open(filepath, "w") as f:
                    f.write(code)

                # Compile if needed
                if "compile_command" in config:
                    executable = os.path.join(tmpdir, "solution")
                    compile_cmd = [
                        cmd.format(file=filepath, executable=executable)
                        for cmd in config["compile_command"]
                    ]

                    try:
                        compile_result = subprocess.run(
                            compile_cmd,
                            cwd=tmpdir,
                            capture_output=True,
                            text=True,
                            timeout=timeout,
                        )

                        if compile_result.returncode != 0:
                            return {
                                "status": "error",
                                "error": f"Compilation error:\n{compile_result.stderr}",
                                "output": None,
                                "execution_time": 0,
                                "memory_used": 0,
                            }
                    except subprocess.TimeoutExpired:
                        return {
                            "status": "timeout",
                            "error": "Compilation timeout",
                            "output": None,
                            "execution_time": timeout * 1000,
                            "memory_used": 0,
                        }

                # Execute code
                run_cmd = [
                    cmd.format(file=filepath, executable=executable if "compile_command" in config else "")
                    for cmd in config["command"]
                ]

                start_time = time.time()

                try:
                    result = subprocess.run(
                        run_cmd,
                        cwd=tmpdir,
                        input=input_data,
                        capture_output=True,
                        text=True,
                        timeout=timeout,
                    )

                    end_time = time.time()
                    execution_time = (end_time - start_time) * 1000  # Convert to ms

                    if result.returncode == 0:
                        return {
                            "status": "success",
                            "output": result.stdout,
                            "error": result.stderr if result.stderr else None,
                            "execution_time": round(execution_time, 2),
                            "memory_used": 0,  # Would need to track this properly
                        }
                    else:
                        return {
                            "status": "error",
                            "error": result.stderr or "Runtime error",
                            "output": result.stdout,
                            "execution_time": round(execution_time, 2),
                            "memory_used": 0,
                        }

                except subprocess.TimeoutExpired:
                    return {
                        "status": "timeout",
                        "error": f"Execution timeout (limit: {timeout}s)",
                        "output": None,
                        "execution_time": timeout * 1000,
                        "memory_used": 0,
                    }

        except Exception as e:
            logger.error(f"Code execution error: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": f"Execution error: {str(e)}",
                "output": None,
                "execution_time": 0,
                "memory_used": 0,
            }

    @staticmethod
    def run_test_cases(
        code: str,
        language: str,
        test_cases: list,
        time_limit: int = 5,
        memory_limit: int = 128,
    ) -> Dict:
        """
        Run code against multiple test cases

        Args:
            code: Source code
            language: Programming language
            test_cases: List of test case dicts with input_data and expected_output
            time_limit: Time limit per test case
            memory_limit: Memory limit in MB

        Returns:
            Dict with overall results and individual test case results
        """
        results = []
        passed_count = 0
        total_time = 0

        for i, test_case in enumerate(test_cases):
            input_data = test_case.get("input_data", "")
            expected_output = test_case.get("expected_output", "").strip()

            exec_result = CodeExecutor.execute_code(
                code=code,
                language=language,
                input_data=input_data,
                time_limit=time_limit,
                memory_limit=memory_limit,
            )

            actual_output = (exec_result.get("output") or "").strip()
            passed = (
                exec_result["status"] == "success" and
                actual_output == expected_output
            )

            if passed:
                passed_count += 1

            total_time += exec_result.get("execution_time", 0)

            results.append({
                "test_case_id": test_case.get("id", i),
                "passed": passed,
                "input_data": input_data if not test_case.get("is_hidden", False) else "[Hidden]",
                "expected_output": expected_output if not test_case.get("is_hidden", False) else "[Hidden]",
                "actual_output": actual_output if not test_case.get("is_hidden", False) else "[Hidden]",
                "execution_time": exec_result.get("execution_time"),
                "error": exec_result.get("error"),
                "points": test_case.get("points", 1),
                "earned_points": test_case.get("points", 1) if passed else 0,
            })

            # Stop on first error for sample test cases
            if not passed and test_case.get("is_sample", False):
                break

        total_test_cases = len(test_cases)
        score = (passed_count / total_test_cases * 100) if total_test_cases > 0 else 0

        return {
            "status": "passed" if passed_count == total_test_cases else "failed",
            "score": round(score, 2),
            "total_test_cases": total_test_cases,
            "passed_test_cases": passed_count,
            "execution_time": round(total_time, 2),
            "test_results": results,
        }


# Singleton instance
code_executor = CodeExecutor()
