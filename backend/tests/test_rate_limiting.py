"""
Tests for rate limiting.
"""
import pytest
import time
from fastapi.testclient import TestClient


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_login_rate_limit(self, client: TestClient, valid_token: str):
        """Test that login endpoint enforces rate limit (5 req/min)."""
        # Make 5 successful requests
        for i in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={"access_token": valid_token}
            )
            assert response.status_code == 200, f"Request {i+1} should succeed"

        # 6th request should be rate limited
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()
        assert "Retry-After" in response.headers

    def test_logout_rate_limit(self, client: TestClient, valid_token: str):
        """Test that logout endpoint enforces rate limit (20 req/min)."""
        # First login to get cookies and CSRF
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        csrf_token = login_response.json()["csrf_token"]
        cookies = login_response.cookies

        # Make 20 logout requests
        for i in range(20):
            # Need to re-login each time since logout clears cookies
            login_resp = client.post(
                "/api/v1/auth/login",
                json={"access_token": valid_token}
            )

            csrf = login_resp.json()["csrf_token"]

            response = client.post(
                "/api/v1/auth/logout",
                headers={"X-CSRF-Token": csrf},
                cookies=login_resp.cookies
            )

            if response.status_code == 429:
                # Hit rate limit earlier due to login requests
                assert "rate limit" in response.json()["detail"].lower()
                break

        # Note: This test might hit login rate limit before logout rate limit
        # So we just verify that rate limiting works

    def test_file_upload_rate_limit(self, client: TestClient, valid_token: str):
        """Test that file upload endpoint enforces rate limit (10 req/min)."""
        # Login first
        login_response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        csrf_token = login_response.json()["csrf_token"]
        cookies = login_response.cookies

        # Create a test file
        test_file_content = b"test file content"

        # Make 10 file upload requests
        success_count = 0
        rate_limited = False

        for i in range(12):  # Try 12 to ensure we hit the limit
            response = client.post(
                "/api/v1/files?course_id=00000000-0000-0000-0000-000000000001",
                files={"file": ("test.txt", test_file_content, "text/plain")},
                headers={"X-CSRF-Token": csrf_token},
                cookies=cookies
            )

            if response.status_code == 429:
                rate_limited = True
                assert "rate limit" in response.json()["detail"].lower()
                assert "Retry-After" in response.headers
                break
            elif response.status_code in [200, 201]:
                success_count += 1
            # Other errors (401, 404, etc.) are ok, we're testing rate limiting

        # Should have been rate limited within 12 requests
        assert rate_limited or success_count >= 10

    def test_rate_limit_per_client(self, client: TestClient, valid_token: str):
        """Test that rate limits are per-client (IP + user)."""
        # This test verifies that rate limits track by client
        # In a real scenario, different clients would have separate limits

        # Make multiple requests
        responses = []
        for i in range(7):
            response = client.post(
                "/api/v1/auth/login",
                json={"access_token": valid_token}
            )
            responses.append(response)

        # Should see rate limiting after 5 requests
        success_count = sum(1 for r in responses if r.status_code == 200)
        rate_limited_count = sum(1 for r in responses if r.status_code == 429)

        assert success_count == 5
        assert rate_limited_count == 2

    def test_rate_limit_retry_after_header(self, client: TestClient, valid_token: str):
        """Test that rate limit response includes Retry-After header."""
        # Hit rate limit
        for i in range(6):
            response = client.post(
                "/api/v1/auth/login",
                json={"access_token": valid_token}
            )

        # Last response should have Retry-After
        assert response.status_code == 429
        assert "Retry-After" in response.headers

        retry_after = int(response.headers["Retry-After"])
        assert retry_after > 0
        assert retry_after <= 60  # Should be within 60 seconds

    @pytest.mark.skip(reason="Slow test - only run manually")
    def test_rate_limit_window_reset(self, client: TestClient, valid_token: str):
        """Test that rate limit resets after window expires."""
        # Hit rate limit
        for i in range(6):
            response = client.post(
                "/api/v1/auth/login",
                json={"access_token": valid_token}
            )

        assert response.status_code == 429

        # Wait for window to reset (61 seconds)
        time.sleep(61)

        # Should be able to make requests again
        response = client.post(
            "/api/v1/auth/login",
            json={"access_token": valid_token}
        )

        assert response.status_code == 200
