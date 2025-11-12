"""
Tests for CSRF protection.
"""
import pytest
from fastapi.testclient import TestClient


class TestCSRFProtection:
    """Test CSRF protection middleware."""

    def test_get_request_without_csrf(self, client: TestClient, valid_token: str):
        """Test that GET requests don't require CSRF token."""
        response = client.get(
            "/health",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        # GET requests should not be blocked by CSRF
        assert response.status_code == 200

    def test_post_to_public_endpoint_without_csrf(self, client: TestClient, valid_token: str):
        """Test that public endpoints don't require CSRF token."""
        # Login endpoint is public
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        assert response.status_code == 200

    def test_post_request_without_csrf_token_fails(self, client: TestClient, valid_token: str):
        """Test that POST requests without CSRF token are rejected."""
        # First login to get cookies
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        # Try to make POST request without CSRF token
        response = client.post(
            "/api/v1/auth/profile",
            json={
                "id": "test-user-id-123",
                "full_name": "Test User",
                "email": "test@example.com"
            },
            cookies=login_response.cookies
            # No X-CSRF-Token header
        )

        # Should be rejected with 403
        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()

    def test_post_request_with_wrong_csrf_token_fails(self, client: TestClient, valid_token: str):
        """Test that POST requests with wrong CSRF token are rejected."""
        # First login to get cookies
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        # Try to make POST request with wrong CSRF token
        response = client.post(
            "/api/v1/auth/profile",
            json={
                "id": "test-user-id-123",
                "full_name": "Test User",
                "email": "test@example.com"
            },
            headers={"X-CSRF-Token": "wrong-token"},
            cookies=login_response.cookies
        )

        # Should be rejected with 403
        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()

    def test_post_request_with_valid_csrf_token_succeeds(self, client: TestClient, valid_token: str):
        """Test that POST requests with valid CSRF token succeed."""
        # First login to get cookies and CSRF token
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        csrf_token = login_response.json()["csrf_token"]

        # Make POST request with valid CSRF token
        response = client.post(
            "/api/v1/auth/profile",
            json={
                "id": "test-user-id-123",
                "full_name": "Test User",
                "email": "test@example.com"
            },
            headers={"X-CSRF-Token": csrf_token},
            cookies=login_response.cookies
        )

        # Should succeed (201) or fail for other reasons (not CSRF)
        # If it's 403, check it's not CSRF-related
        if response.status_code == 403:
            assert "csrf" not in response.json()["detail"].lower()
        else:
            assert response.status_code in [200, 201, 400, 409]  # Various success/error codes

    def test_put_request_requires_csrf(self, client: TestClient, valid_token: str):
        """Test that PUT requests require CSRF token."""
        # First login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        # Try PUT without CSRF
        response = client.put(
            "/api/v1/auth/profile",
            json={"full_name": "Updated Name"},
            cookies=login_response.cookies
        )

        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()

    def test_delete_request_requires_csrf(self, client: TestClient, valid_token: str):
        """Test that DELETE requests require CSRF token."""
        # First login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        # Try DELETE without CSRF (using a generic endpoint)
        response = client.delete(
            "/api/v1/files/00000000-0000-0000-0000-000000000000",
            cookies=login_response.cookies
        )

        # Should be rejected with 403 (CSRF) before 404 (not found)
        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()
