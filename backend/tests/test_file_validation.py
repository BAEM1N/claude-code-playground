"""
Tests for file upload validation.
"""
import pytest
import io
from fastapi.testclient import TestClient


class TestFileValidation:
    """Test file upload validation."""

    @pytest.fixture
    def auth_setup(self, client: TestClient, valid_token: str):
        """Setup authentication for file upload tests."""
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )
        return {
            "csrf_token": login_response.json()["csrf_token"],
            "cookies": login_response.cookies
        }

    def test_upload_valid_file(self, client: TestClient, auth_setup: dict):
        """Test uploading a valid file."""
        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("test.txt", b"test content", "text/plain")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        # Should succeed or fail for reasons other than validation
        # 400 with "not allowed" means validation failed
        if response.status_code == 400:
            assert "not allowed" not in response.json()["detail"].lower()

    def test_upload_file_with_invalid_extension(self, client: TestClient, auth_setup: dict):
        """Test uploading a file with invalid extension."""
        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("malicious.exe", b"fake exe content", "application/x-msdownload")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        assert response.status_code == 400
        assert "not allowed" in response.json()["detail"].lower()

    def test_upload_file_with_dangerous_extension(self, client: TestClient, auth_setup: dict):
        """Test uploading files with dangerous extensions."""
        dangerous_files = [
            ("script.sh", b"#!/bin/bash", "application/x-sh"),
            ("virus.bat", b"@echo off", "application/x-bat"),
            ("malware.vbs", b"MsgBox", "application/x-vbs"),
        ]

        for filename, content, mime_type in dangerous_files:
            response = client.post(
                "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
                files={"file": (filename, content, mime_type)},
                headers={"X-CSRF-Token": auth_setup["csrf_token"]},
                cookies=auth_setup["cookies"]
            )

            # Should be rejected
            assert response.status_code == 400
            assert "not allowed" in response.json()["detail"].lower()

    def test_upload_oversized_file(self, client: TestClient, auth_setup: dict):
        """Test uploading a file exceeding size limit (50MB)."""
        # Create a large file (simulating >50MB)
        # Note: Creating actual 50MB+ file is slow, so we'll test the logic
        large_content = b"x" * (51 * 1024 * 1024)  # 51MB

        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("large.txt", large_content, "text/plain")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        # Should be rejected (either 413 or 400)
        assert response.status_code in [400, 413]
        if response.status_code == 400:
            assert "size" in response.json()["detail"].lower() or "large" in response.json()["detail"].lower()

    def test_upload_file_with_path_traversal(self, client: TestClient, auth_setup: dict):
        """Test that path traversal attempts are sanitized."""
        malicious_filenames = [
            "../../etc/passwd",
            "../../../etc/shadow",
            "..\\..\\windows\\system32\\config\\sam",
        ]

        for filename in malicious_filenames:
            response = client.post(
                "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
                files={"file": (filename, b"malicious content", "text/plain")},
                headers={"X-CSRF-Token": auth_setup["csrf_token"]},
                cookies=auth_setup["cookies"]
            )

            # Should succeed but with sanitized filename
            # Or fail for other reasons (not path traversal)
            if response.status_code in [200, 201]:
                # File was created, check that filename was sanitized
                data = response.json()
                assert ".." not in data.get("original_name", "")
                assert "/" not in data.get("original_name", "")
                assert "\\" not in data.get("original_name", "")

    def test_upload_file_with_null_bytes(self, client: TestClient, auth_setup: dict):
        """Test that null bytes in filename are handled."""
        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("test\x00.txt", b"content", "text/plain")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        # Should handle gracefully (sanitize or reject)
        if response.status_code in [200, 201]:
            data = response.json()
            assert "\x00" not in data.get("original_name", "")

    def test_upload_allowed_document_types(self, client: TestClient, auth_setup: dict):
        """Test uploading allowed document types."""
        allowed_files = [
            ("document.pdf", b"PDF content", "application/pdf"),
            ("document.docx", b"DOCX content", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            ("notes.txt", b"Text content", "text/plain"),
            ("readme.md", b"# Markdown", "text/markdown"),
        ]

        for filename, content, mime_type in allowed_files:
            response = client.post(
                "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
                files={"file": (filename, content, mime_type)},
                headers={"X-CSRF-Token": auth_setup["csrf_token"]},
                cookies=auth_setup["cookies"]
            )

            # Should not be rejected for validation reasons
            if response.status_code == 400:
                detail = response.json()["detail"].lower()
                assert "not allowed" not in detail
                assert "type" not in detail

    def test_upload_allowed_image_types(self, client: TestClient, auth_setup: dict):
        """Test uploading allowed image types."""
        allowed_images = [
            ("image.jpg", b"JPEG data", "image/jpeg"),
            ("image.png", b"PNG data", "image/png"),
            ("image.gif", b"GIF data", "image/gif"),
            ("icon.svg", b"<svg></svg>", "image/svg+xml"),
        ]

        for filename, content, mime_type in allowed_images:
            response = client.post(
                "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
                files={"file": (filename, content, mime_type)},
                headers={"X-CSRF-Token": auth_setup["csrf_token"]},
                cookies=auth_setup["cookies"]
            )

            # Should not be rejected for validation reasons
            if response.status_code == 400:
                detail = response.json()["detail"].lower()
                assert "not allowed" not in detail

    def test_upload_file_without_extension(self, client: TestClient, auth_setup: dict):
        """Test uploading a file without extension."""
        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("README", b"content", "text/plain")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        # Should be rejected
        assert response.status_code == 400

    def test_upload_empty_file(self, client: TestClient, auth_setup: dict):
        """Test uploading an empty file."""
        response = client.post(
            "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
            files={"file": ("empty.txt", b"", "text/plain")},
            headers={"X-CSRF-Token": auth_setup["csrf_token"]},
            cookies=auth_setup["cookies"]
        )

        # Should be rejected (0 size)
        assert response.status_code == 400
