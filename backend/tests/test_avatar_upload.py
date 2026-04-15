"""
Avatar Upload API Tests
Tests for POST /api/users/{user_id}/avatar and GET /api/users/{user_id}/avatar/image endpoints
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user ID from test_credentials.md
TEST_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
NONEXISTENT_USER_ID = "00000000-0000-0000-0000-000000000000"


class TestAvatarUploadEndpoint:
    """Tests for POST /api/users/{user_id}/avatar endpoint"""
    
    def test_avatar_upload_endpoint_exists(self):
        """Test that avatar upload endpoint exists and accepts POST"""
        # Create a minimal valid image (1x1 PNG)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # bit depth, color type
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,  # compressed data
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, f"Avatar upload endpoint not found. Status: {response.status_code}"
        print(f"Avatar upload endpoint exists, status: {response.status_code}")
    
    def test_avatar_upload_jpeg_success(self):
        """Test uploading a JPEG image"""
        # Create a minimal valid JPEG
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,  # JPEG header
            0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
            0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,  # DQT
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
            0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
            0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
            0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
            0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
            0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
            0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,  # SOF0
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,  # DHT
            0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
            0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
            0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
            0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
            0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
            0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
            0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1,
            0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A,
            0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
            0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
            0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65,
            0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85,
            0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
            0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
            0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA,
            0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8,
            0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
            0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,  # SOS
            0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
            0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7F, 0xFF,
            0xD9  # EOI
        ])
        
        files = {'file': ('test.jpg', io.BytesIO(jpeg_data), 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"JPEG upload response: {response.status_code} - {response.text[:200] if response.text else 'No body'}")
        
        # Should succeed (200) or storage unavailable (503)
        assert response.status_code in [200, 503], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data, "Response should have 'success' field"
            assert data["success"] == True, "Upload should succeed"
            assert "avatar_url" in data, "Response should have 'avatar_url' field"
            assert f"/api/users/{TEST_USER_ID}/avatar/image" in data["avatar_url"], "Avatar URL should point to serve endpoint"
            print(f"JPEG upload successful, avatar_url: {data['avatar_url']}")
    
    def test_avatar_upload_png_success(self):
        """Test uploading a PNG image"""
        # Create a minimal valid PNG (1x1 pixel)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # bit depth, color type
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,  # compressed data
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"PNG upload response: {response.status_code}")
        
        # Should succeed (200) or storage unavailable (503)
        assert response.status_code in [200, 503], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Upload should succeed"
            print(f"PNG upload successful")
    
    def test_avatar_upload_webp_accepted(self):
        """Test that WebP content type is accepted"""
        # Minimal WebP header
        webp_data = bytes([
            0x52, 0x49, 0x46, 0x46,  # RIFF
            0x24, 0x00, 0x00, 0x00,  # File size
            0x57, 0x45, 0x42, 0x50,  # WEBP
            0x56, 0x50, 0x38, 0x4C,  # VP8L
            0x17, 0x00, 0x00, 0x00,  # Chunk size
            0x2F, 0x00, 0x00, 0x00,  # Signature
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ])
        
        files = {'file': ('test.webp', io.BytesIO(webp_data), 'image/webp')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"WebP upload response: {response.status_code}")
        
        # Should succeed (200), storage unavailable (503), or possibly 500 if storage rejects invalid webp
        # But should NOT be 400 for content type rejection
        if response.status_code == 400:
            data = response.json()
            # Only fail if it's a content type rejection
            assert "Only JPEG, PNG, WebP or GIF" not in data.get("detail", ""), "WebP should be accepted"
    
    def test_avatar_upload_gif_accepted(self):
        """Test that GIF content type is accepted"""
        # Minimal GIF header
        gif_data = bytes([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61,  # GIF89a
            0x01, 0x00, 0x01, 0x00,  # 1x1 dimensions
            0x00, 0x00, 0x00,  # Global color table flag
            0x2C, 0x00, 0x00, 0x00, 0x00,  # Image descriptor
            0x01, 0x00, 0x01, 0x00, 0x00,
            0x02, 0x02, 0x44, 0x01, 0x00,  # Image data
            0x3B  # Trailer
        ])
        
        files = {'file': ('test.gif', io.BytesIO(gif_data), 'image/gif')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"GIF upload response: {response.status_code}")
        
        # Should succeed (200), storage unavailable (503), or possibly 500
        # But should NOT be 400 for content type rejection
        if response.status_code == 400:
            data = response.json()
            assert "Only JPEG, PNG, WebP or GIF" not in data.get("detail", ""), "GIF should be accepted"
    
    def test_avatar_upload_rejects_non_image(self):
        """Test that non-image files are rejected with 400"""
        # Plain text file
        text_data = b"This is not an image file"
        
        files = {'file': ('test.txt', io.BytesIO(text_data), 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"Non-image upload response: {response.status_code} - {response.text[:200] if response.text else 'No body'}")
        
        assert response.status_code == 400, f"Non-image should be rejected with 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should have 'detail' field"
        assert "JPEG" in data["detail"] or "image" in data["detail"].lower(), "Error should mention allowed image types"
        print(f"Non-image correctly rejected: {data['detail']}")
    
    def test_avatar_upload_rejects_pdf(self):
        """Test that PDF files are rejected"""
        # Minimal PDF header
        pdf_data = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        
        files = {'file': ('test.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"PDF upload response: {response.status_code}")
        
        assert response.status_code == 400, f"PDF should be rejected with 400, got {response.status_code}"
        print("PDF correctly rejected")
    
    def test_avatar_upload_rejects_large_file(self):
        """Test that files over 5MB are rejected"""
        # Create a file slightly over 5MB (5.1MB)
        large_data = b"x" * (5 * 1024 * 1024 + 100000)  # 5.1MB
        
        files = {'file': ('large.png', io.BytesIO(large_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=120)
        
        print(f"Large file upload response: {response.status_code} - {response.text[:200] if response.text else 'No body'}")
        
        assert response.status_code == 400, f"Large file should be rejected with 400, got {response.status_code}"
        
        data = response.json()
        assert "5 MB" in data.get("detail", "") or "5MB" in data.get("detail", ""), "Error should mention 5MB limit"
        print(f"Large file correctly rejected: {data['detail']}")
    
    def test_avatar_upload_nonexistent_user_returns_404(self):
        """Test that uploading avatar for non-existent user returns 404"""
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/users/{NONEXISTENT_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"Nonexistent user upload response: {response.status_code}")
        
        assert response.status_code == 404, f"Nonexistent user should return 404, got {response.status_code}"
        
        data = response.json()
        assert "not found" in data.get("detail", "").lower(), "Error should mention user not found"
        print(f"Nonexistent user correctly returns 404: {data['detail']}")


class TestAvatarServeEndpoint:
    """Tests for GET /api/users/{user_id}/avatar/image endpoint"""
    
    def test_avatar_serve_endpoint_exists(self):
        """Test that avatar serve endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar/image", timeout=30)
        
        # Should not return 405 (method not allowed)
        assert response.status_code != 405, "GET method should be allowed"
        print(f"Avatar serve endpoint exists, status: {response.status_code}")
    
    def test_avatar_serve_returns_image_content_type(self):
        """Test that serving avatar returns correct content-type"""
        # First upload an image
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        if upload_response.status_code != 200:
            pytest.skip(f"Upload failed with {upload_response.status_code}, skipping serve test")
        
        # Now try to serve it
        response = requests.get(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar/image", timeout=30)
        
        print(f"Avatar serve response: {response.status_code}, Content-Type: {response.headers.get('Content-Type')}")
        
        assert response.status_code == 200, f"Serve should return 200, got {response.status_code}"
        
        content_type = response.headers.get('Content-Type', '')
        assert content_type.startswith('image/'), f"Content-Type should be image/*, got {content_type}"
        print(f"Avatar served with correct content-type: {content_type}")
    
    def test_avatar_serve_nonexistent_user_returns_404(self):
        """Test that serving avatar for non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/{NONEXISTENT_USER_ID}/avatar/image", timeout=30)
        
        print(f"Nonexistent user serve response: {response.status_code}")
        
        assert response.status_code == 404, f"Nonexistent user should return 404, got {response.status_code}"
        print("Nonexistent user correctly returns 404")
    
    def test_avatar_serve_has_cache_control(self):
        """Test that served avatar has cache-control header"""
        # First ensure there's an avatar
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        if upload_response.status_code != 200:
            pytest.skip(f"Upload failed with {upload_response.status_code}, skipping cache test")
        
        response = requests.get(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar/image", timeout=30)
        
        if response.status_code == 200:
            cache_control = response.headers.get('Cache-Control', '')
            print(f"Cache-Control header: {cache_control}")
            # The endpoint sets "public, max-age=3600"
            assert 'max-age' in cache_control.lower() or 'public' in cache_control.lower(), \
                f"Cache-Control should be set, got: {cache_control}"


class TestAvatarIntegration:
    """Integration tests for avatar upload and serve flow"""
    
    def test_upload_then_serve_roundtrip(self):
        """Test complete flow: upload image, then serve it back"""
        # Create a valid PNG
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        # Step 1: Upload
        files = {'file': ('roundtrip.png', io.BytesIO(png_data), 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        print(f"Upload response: {upload_response.status_code}")
        
        if upload_response.status_code == 503:
            pytest.skip("Storage service unavailable")
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        
        upload_data = upload_response.json()
        assert upload_data.get("success") == True
        avatar_url = upload_data.get("avatar_url")
        assert avatar_url is not None
        
        # Step 2: Serve
        serve_response = requests.get(f"{BASE_URL}{avatar_url}", timeout=30)
        
        print(f"Serve response: {serve_response.status_code}, Content-Type: {serve_response.headers.get('Content-Type')}")
        
        assert serve_response.status_code == 200, f"Serve failed: {serve_response.status_code}"
        assert serve_response.headers.get('Content-Type', '').startswith('image/')
        
        # Verify we got actual image data back
        assert len(serve_response.content) > 0, "Served content should not be empty"
        print(f"Roundtrip successful! Served {len(serve_response.content)} bytes")
    
    def test_user_record_updated_after_upload(self):
        """Test that user record is updated with avatar URL after upload"""
        # Upload an image
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/api/users/{TEST_USER_ID}/avatar", files=files, timeout=60)
        
        if upload_response.status_code != 200:
            pytest.skip(f"Upload failed with {upload_response.status_code}")
        
        # Fetch user record
        user_response = requests.get(f"{BASE_URL}/api/users/{TEST_USER_ID}", timeout=30)
        
        assert user_response.status_code == 200, f"Failed to fetch user: {user_response.status_code}"
        
        user_data = user_response.json()
        print(f"User avatar field: {user_data.get('avatar')}")
        
        assert "avatar" in user_data, "User record should have 'avatar' field"
        assert user_data["avatar"] is not None, "Avatar should not be None after upload"
        assert f"/api/users/{TEST_USER_ID}/avatar/image" in user_data["avatar"], \
            f"Avatar URL should point to serve endpoint, got: {user_data['avatar']}"
        print(f"User record correctly updated with avatar: {user_data['avatar']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
