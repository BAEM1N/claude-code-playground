"""
Code Validation and Sandboxing

Validates user code before execution to prevent malicious operations.
Uses pattern matching and AST analysis to detect dangerous code.

Security Measures:
- Blocks dangerous imports (os, subprocess, sys, etc.)
- Blocks dangerous built-ins (eval, exec, compile, etc.)
- Blocks file system operations
- Blocks network operations
- Blocks system commands

Usage:
    from app.services.code_validator import validate_code_safety

    try:
        validate_code_safety(user_code, kernel_type="python3")
    except ValueError as e:
        # Code contains forbidden operations
        return {"error": str(e)}
"""

import re
import ast
import logging
from typing import Set, List

logger = logging.getLogger(__name__)


# Dangerous patterns for Python
DANGEROUS_IMPORTS_PYTHON = {
    "os",
    "subprocess",
    "sys",
    "pty",
    "commands",
    "popen2",
    "multiprocessing",
    "threading",
    "socket",
    "urllib",
    "requests",
    "http",
    "ftplib",
    "telnetlib",
    "smtplib",
    "pickle",
    "shelve",
    "marshal",
    "ctypes",
    "imp",
    "importlib",
    "__import__",
}

DANGEROUS_BUILTINS_PYTHON = {
    "eval",
    "exec",
    "compile",
    "open",
    "file",
    "__builtins__",
    "__import__",
    "input",
    "raw_input",
    "execfile",
    "reload",
    "vars",
    "locals",
    "globals",
    "dir",
    "getattr",
    "setattr",
    "delattr",
    "hasattr",
}

# Dangerous patterns for JavaScript
DANGEROUS_PATTERNS_JAVASCRIPT = [
    r"require\s*\(",
    r"import\s+.*\s+from",
    r"eval\s*\(",
    r"Function\s*\(",
    r"setTimeout\s*\(",
    r"setInterval\s*\(",
    r"process\.",
    r"child_process",
    r"fs\.",
    r"net\.",
    r"http\.",
    r"https\.",
    r"fetch\s*\(",
    r"XMLHttpRequest",
]


class PythonASTVisitor(ast.NodeVisitor):
    """AST visitor to detect dangerous operations in Python code"""

    def __init__(self):
        self.dangerous_operations: List[str] = []
        self.imports: Set[str] = set()
        self.function_calls: Set[str] = set()

    def visit_Import(self, node):
        """Check import statements"""
        for alias in node.names:
            module_name = alias.name.split(".")[0]
            self.imports.add(module_name)

            if module_name in DANGEROUS_IMPORTS_PYTHON:
                self.dangerous_operations.append(
                    f"Forbidden import: {module_name}"
                )

        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        """Check from...import statements"""
        if node.module:
            module_name = node.module.split(".")[0]
            self.imports.add(module_name)

            if module_name in DANGEROUS_IMPORTS_PYTHON:
                self.dangerous_operations.append(
                    f"Forbidden import from: {module_name}"
                )

        self.generic_visit(node)

    def visit_Call(self, node):
        """Check function calls"""
        # Get function name
        func_name = None
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr

        if func_name:
            self.function_calls.add(func_name)

            if func_name in DANGEROUS_BUILTINS_PYTHON:
                self.dangerous_operations.append(
                    f"Forbidden function call: {func_name}()"
                )

        self.generic_visit(node)

    def visit_Attribute(self, node):
        """Check attribute access"""
        # Check for __builtins__ access
        if isinstance(node.value, ast.Name):
            if node.value.id in {"__builtins__", "__globals__", "__locals__"}:
                self.dangerous_operations.append(
                    f"Forbidden attribute access: {node.value.id}"
                )

        self.generic_visit(node)


def validate_python_code(code: str) -> None:
    """
    Validate Python code for security issues

    Args:
        code: Python code to validate

    Raises:
        ValueError: If code contains forbidden operations
    """
    # Parse code into AST
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        # Syntax errors will be caught during execution
        logger.warning(f"Syntax error in code validation: {e}")
        return

    # Visit AST to find dangerous operations
    visitor = PythonASTVisitor()
    visitor.visit(tree)

    if visitor.dangerous_operations:
        error_msg = "Code contains forbidden operations:\n" + "\n".join(
            f"  - {op}" for op in visitor.dangerous_operations
        )
        logger.warning(f"Code validation failed: {error_msg}")
        raise ValueError(error_msg)

    # Additional string-based checks (for obfuscated code)
    code_lower = code.lower()

    # Check for suspicious string patterns
    suspicious_patterns = [
        (r"__import__", "Dynamic import via __import__"),
        (r"exec\s*\(", "Dynamic code execution via exec()"),
        (r"eval\s*\(", "Dynamic code execution via eval()"),
        (r"compile\s*\(", "Dynamic code compilation"),
        (r"open\s*\(", "File operations"),
    ]

    for pattern, description in suspicious_patterns:
        if re.search(pattern, code_lower):
            logger.warning(f"Suspicious pattern detected: {description}")
            raise ValueError(f"Forbidden operation: {description}")


def validate_javascript_code(code: str) -> None:
    """
    Validate JavaScript code for security issues

    Args:
        code: JavaScript code to validate

    Raises:
        ValueError: If code contains forbidden operations
    """
    code_lower = code.lower()

    for pattern in DANGEROUS_PATTERNS_JAVASCRIPT:
        if re.search(pattern, code_lower, re.IGNORECASE):
            logger.warning(f"Dangerous JavaScript pattern detected: {pattern}")
            raise ValueError(f"Forbidden JavaScript operation detected: {pattern}")


def validate_sql_code(code: str) -> None:
    """
    Validate SQL code for security issues

    Args:
        code: SQL code to validate

    Raises:
        ValueError: If code contains forbidden operations
    """
    code_upper = code.upper()

    # Block dangerous SQL operations
    dangerous_keywords = [
        "DROP ",
        "DELETE ",
        "TRUNCATE ",
        "ALTER ",
        "CREATE ",
        "INSERT ",
        "UPDATE ",
        "GRANT ",
        "REVOKE ",
        "EXEC ",
        "EXECUTE ",
    ]

    for keyword in dangerous_keywords:
        if keyword in code_upper:
            logger.warning(f"Dangerous SQL keyword detected: {keyword.strip()}")
            raise ValueError(
                f"Forbidden SQL operation: {keyword.strip()}. Only SELECT queries are allowed."
            )


def validate_code_safety(code: str, kernel_type: str = "python3") -> None:
    """
    Validate code for security issues based on kernel type

    Args:
        code: Code to validate
        kernel_type: Type of kernel (python3, javascript, sql)

    Raises:
        ValueError: If code contains forbidden operations

    Usage:
        try:
            validate_code_safety(user_code, "python3")
        except ValueError as e:
            return {"error": str(e), "status": "forbidden"}
    """
    logger.info(f"Validating code safety for kernel type: {kernel_type}")

    # Check code length (already validated in schema, but double-check)
    if len(code) > 50000:
        raise ValueError("Code exceeds maximum length of 50,000 characters")

    # Validate based on kernel type
    if kernel_type == "python3":
        validate_python_code(code)
    elif kernel_type == "javascript":
        validate_javascript_code(code)
    elif kernel_type == "sql":
        validate_sql_code(code)
    else:
        raise ValueError(f"Unsupported kernel type: {kernel_type}")

    logger.info("Code validation passed")


# Quick regex patterns for emergency blocking (faster than AST)
def quick_validate_code(code: str) -> bool:
    """
    Quick validation using regex patterns only
    Returns True if code appears safe, False otherwise
    """
    dangerous_patterns = [
        r"\bos\.",
        r"\bsubprocess\.",
        r"\beval\s*\(",
        r"\bexec\s*\(",
        r"\bopen\s*\(",
        r"__import__",
        r"__builtins__",
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            return False

    return True


def mask_sensitive_data(code: str) -> str:
    """
    Mask sensitive information in code before storing in database

    Masks common patterns for:
    - API keys
    - Passwords
    - Tokens
    - Secret keys
    - Database credentials

    Args:
        code: Original code

    Returns:
        Code with sensitive data masked

    Example:
        >>> mask_sensitive_data('api_key = "sk-abc123"')
        'api_key = "***MASKED***"'
    """
    # Patterns to mask (variable_name = "value")
    patterns = [
        # API keys, tokens, secrets
        (r'(api[_-]?key\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(token\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(secret[_-]?key\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(access[_-]?token\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(bearer\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),

        # Passwords
        (r'(password\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(passwd\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(pwd\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),

        # Database credentials
        (r'(db[_-]?password\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(database[_-]?url\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(connection[_-]?string\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),

        # AWS keys
        (r'(aws[_-]?access[_-]?key[_-]?id\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(aws[_-]?secret[_-]?access[_-]?key\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),

        # Generic credentials
        (r'(client[_-]?secret\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
        (r'(private[_-]?key\s*=\s*["\'])([^"\']+)(["\'])', r'\1***MASKED***\3'),
    ]

    masked_code = code
    for pattern, replacement in patterns:
        masked_code = re.sub(pattern, replacement, masked_code, flags=re.IGNORECASE)

    return masked_code
