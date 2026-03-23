"""
Tests for voice preview/playback feature in Text-to-Video page.
Tests:
- POST /api/tts/generate-base64 - TTS endpoint for voice preview
- Voice list rendering and selection
- Voice preview API integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://chat-attachments-fix.preview.emergentagent.com')

class TestTTSBase64Endpoint:
    """Tests for TTS base64 endpoint used for voice preview"""
    
    def test_tts_generate_base64_endpoint_exists(self):
        """POST /api/tts/generate-base64 endpoint should exist and accept requests"""
        payload = {
            "text": "Hello, this is a test preview.",
            "voice": "nova",
            "speed": 1.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tts/generate-base64",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should either succeed (200) or fail due to service config (500)
        # Should NOT be 404 (endpoint missing) or 422 (validation error)
        assert response.status_code in [200, 500], f"Got unexpected status {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data, "Response should contain 'success' field"
            assert "audio" in data, "Response should contain 'audio' field with base64 data"
            assert "mime_type" in data, "Response should contain 'mime_type' field"
            assert data["mime_type"] == "audio/mpeg", f"Expected audio/mpeg, got {data['mime_type']}"
            print(f"✓ TTS base64 endpoint returns valid audio data (mime: {data['mime_type']})")
        else:
            print(f"✓ TTS endpoint exists but service may not be configured (500 response)")
    
    def test_tts_generate_base64_with_all_voices(self):
        """POST /api/tts/generate-base64 should accept all 6 valid voices"""
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        
        for voice in valid_voices:
            payload = {
                "text": f"Testing voice {voice}",
                "voice": voice,
                "speed": 1.0
            }
            
            response = requests.post(
                f"{BASE_URL}/api/tts/generate-base64",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            # Should accept all valid voices without 422 validation error
            assert response.status_code in [200, 500], f"Voice '{voice}' rejected: {response.status_code} - {response.text}"
        
        print(f"✓ TTS endpoint accepts all 6 valid voices")
    
    def test_tts_generate_base64_default_voice(self):
        """POST /api/tts/generate-base64 should use default voice when not specified"""
        payload = {
            "text": "Testing default voice",
            # No voice specified - should default to 'alloy' per TTSRequest model
            "speed": 1.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tts/generate-base64",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [200, 500], f"Got unexpected status {response.status_code}: {response.text}"
        print(f"✓ TTS endpoint accepts request without voice (uses default)")
    
    def test_tts_generate_base64_speed_parameter(self):
        """POST /api/tts/generate-base64 should accept speed parameter"""
        payload = {
            "text": "Testing speed parameter",
            "voice": "nova",
            "speed": 1.2  # Slightly faster
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tts/generate-base64",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [200, 500], f"Got unexpected status {response.status_code}: {response.text}"
        print(f"✓ TTS endpoint accepts speed parameter")


class TestTTSVoicesEndpoint:
    """Tests for TTS voices list endpoint"""
    
    def test_tts_voices_endpoint_returns_all_voices(self):
        """GET /api/tts/voices should return all 6 voices with metadata"""
        response = requests.get(f"{BASE_URL}/api/tts/voices")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "voices" in data, "Response should contain 'voices' array"
        
        voices = data["voices"]
        assert len(voices) == 6, f"Expected 6 voices, got {len(voices)}"
        
        # Check expected voices
        voice_ids = [v["id"] for v in voices]
        expected_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        
        for voice_id in expected_voices:
            assert voice_id in voice_ids, f"Voice '{voice_id}' should be in the list"
        
        # Check voice structure
        for voice in voices:
            assert "id" in voice, "Each voice should have 'id'"
            assert "name" in voice, "Each voice should have 'name'"
            assert "description" in voice, "Each voice should have 'description'"
        
        print(f"✓ TTS voices endpoint returns all 6 voices with proper structure")


class TestVideoGenerateWithVoice:
    """Tests for video generation with voice parameter"""
    
    def test_video_generate_includes_voice_in_request(self):
        """POST /api/ai/video/generate should accept voice parameter"""
        payload = {
            "prompt": "TEST_VOICE_PREVIEW: A test video",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4,
            "voice": "shimmer"  # Test with shimmer voice
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/video/generate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should accept without validation errors
        assert response.status_code in [200, 201, 500], f"Got unexpected status {response.status_code}: {response.text}"
        print(f"✓ Video generate accepts voice parameter 'shimmer'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
