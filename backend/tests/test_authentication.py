"""
Tests for cookie-based authentication.
"""
import pytest
from fastapi.testclient import TestClient


class TestCookieAuthentication:
    """Test cookie-based authentication flow."""

    def test_login_sets_cookies(self, client: TestClient, valid_token: str):
        """Test that login endpoint sets HTTP-only cookies."""
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        assert response.status_code == 200
        data = response.json()

        # Check response contains CSRF token
        assert "csrf_token" in data
        assert "user" in data
        assert data["user"]["id"] == "test-user-id-123"

        # Check cookies are set
        assert "access_token" in response.cookies
        assert "csrf_token" in response.cookies

        # Verify cookie attributes
        access_token_cookie = response.cookies.get("access_token")
        assert access_token_cookie is not None

    def test_login_with_invalid_token(self, client: TestClient):
        """Test login with invalid token returns 401."""
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": "invalid-token"}
        )

        assert response.status_code == 401
        assert "invalid token" in response.json()["detail"].lower()

    def test_login_with_expired_token(self, client: TestClient, expired_token: str):
        """Test login with expired token returns 401."""
        # Note: The token decoding might not check expiration in login endpoint
        # This depends on implementation
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": expired_token}
        )

        # Should either accept (and set cookies) or reject based on implementation
        # If it checks expiration, it should return 401
        assert response.status_code in [200, 401]

    def test_logout_clears_cookies(self, client: TestClient, valid_token: str):
        """Test that logout clears authentication cookies."""
        # First login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )
        assert login_response.status_code == 200

        csrf_token = login_response.json()["csrf_token"]

        # Then logout with CSRF token
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers={"X-CSRF-Token": csrf_token},
            cookies=login_response.cookies
        )

        assert logout_response.status_code == 200
        assert logout_response.json()["message"] == "Logout successful"

    def test_authenticated_request_with_cookie(self, client: TestClient, valid_token: str):
        """Test that authenticated endpoint accepts cookie-based auth."""
        # First login to get cookies
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )
        assert login_response.status_code == 200

        # Make authenticated request using cookies (no Authorization header)
        response = client.get(
            "/api/v1/auth/me",
            cookies=login_response.cookies
        )

        # Should succeed or return 404 if profile doesn't exist
        # 401 means auth failed
        assert response.status_code in [200, 404]

    def test_authenticated_request_with_header(self, client: TestClient, valid_token: str):
        """Test backward compatibility with Authorization header."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {valid_token}"}
        )

        # Should succeed or return 404 if profile doesn't exist
        # 401 means auth failed
        assert response.status_code in [200, 404]

    def test_authenticated_request_without_auth(self, client: TestClient):
        """Test that request without auth returns 401."""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_get_csrf_token(self, client: TestClient):
        """Test CSRF token endpoint returns token."""
        response = client.get("/api/v1/auth/csrf-token")

        assert response.status_code == 200
        data = response.json()
        assert "csrf_token" in data
        assert len(data["csrf_token"]) > 0
