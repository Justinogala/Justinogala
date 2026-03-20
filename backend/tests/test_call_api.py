"""
Test suite for WebRTC Call API endpoints
Tests the REST API signaling layer for audio/video calls
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://incident-hub-44.preview.emergentagent.com')

class TestCallAPI:
    """Tests for Call initiation, acceptance, rejection, and ending"""
    
    def test_call_initiate_audio(self):
        """Test initiating an audio call"""
        call_id = f"test-call-{uuid.uuid4()}"
        response = requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=user123",
            json={
                "target_user_id": "user456",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["call"]["call_id"] == call_id
        assert data["call"]["caller_id"] == "user123"
        assert data["call"]["target_user_id"] == "user456"
        assert data["call"]["call_type"] == "audio"
        assert data["call"]["status"] == "ringing"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "user456",
            "caller_id": "user123"
        })
    
    def test_call_initiate_video(self):
        """Test initiating a video call"""
        call_id = f"test-call-{uuid.uuid4()}"
        response = requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=user789",
            json={
                "target_user_id": "user101",
                "call_type": "video",
                "call_id": call_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["call"]["call_type"] == "video"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "user101",
            "caller_id": "user789"
        })
    
    def test_call_status(self):
        """Test getting call status"""
        # First initiate a call
        call_id = f"test-call-{uuid.uuid4()}"
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=userA",
            json={
                "target_user_id": "userB",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        # Get status
        response = requests.get(f"{BASE_URL}/api/call/status/{call_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["call"]["call_id"] == call_id
        assert data["call"]["status"] == "ringing"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "userB",
            "caller_id": "userA"
        })
    
    def test_call_accept(self):
        """Test accepting a call"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate call
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller1",
            json={
                "target_user_id": "receiver1",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        # Accept call
        response = requests.post(
            f"{BASE_URL}/api/call/accept",
            json={
                "call_id": call_id,
                "caller_id": "caller1",
                "target_user_id": "receiver1"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "connecting"
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "receiver1",
            "caller_id": "caller1"
        })
    
    def test_call_reject(self):
        """Test rejecting a call"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate call
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller2",
            json={
                "target_user_id": "receiver2",
                "call_type": "video",
                "call_id": call_id
            }
        )
        
        # Reject call
        response = requests.post(
            f"{BASE_URL}/api/call/reject",
            json={
                "call_id": call_id,
                "caller_id": "caller2",
                "target_user_id": "receiver2"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "rejected"
        
        # Verify call is cleaned up
        status_response = requests.get(f"{BASE_URL}/api/call/status/{call_id}")
        assert status_response.json()["call"] is None
    
    def test_call_end(self):
        """Test ending a call"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate call
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller3",
            json={
                "target_user_id": "receiver3",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        # End call
        response = requests.post(
            f"{BASE_URL}/api/call/end",
            json={
                "call_id": call_id,
                "target_user_id": "receiver3",
                "caller_id": "caller3"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "ended"
    
    def test_call_signal_offer(self):
        """Test sending WebRTC offer signal"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate call first
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller4",
            json={
                "target_user_id": "receiver4",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        # Send offer signal
        response = requests.post(
            f"{BASE_URL}/api/call/signal",
            json={
                "call_id": call_id,
                "caller_id": "caller4",
                "target_user_id": "receiver4",
                "signal_type": "offer",
                "signal_data": {"type": "offer", "sdp": "test-sdp-offer"}
            }
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "receiver4",
            "caller_id": "caller4"
        })
    
    def test_call_signal_answer(self):
        """Test sending WebRTC answer signal"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate and accept call first
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller5",
            json={
                "target_user_id": "receiver5",
                "call_type": "video",
                "call_id": call_id
            }
        )
        
        # Send answer signal
        response = requests.post(
            f"{BASE_URL}/api/call/signal",
            json={
                "call_id": call_id,
                "caller_id": "receiver5",
                "target_user_id": "caller5",
                "signal_type": "answer",
                "signal_data": {"type": "answer", "sdp": "test-sdp-answer"}
            }
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "receiver5",
            "caller_id": "caller5"
        })
    
    def test_call_signal_ice_candidate(self):
        """Test sending ICE candidate signal"""
        call_id = f"test-call-{uuid.uuid4()}"
        
        # Initiate call
        requests.post(
            f"{BASE_URL}/api/call/initiate?caller_id=caller6",
            json={
                "target_user_id": "receiver6",
                "call_type": "audio",
                "call_id": call_id
            }
        )
        
        # Send ICE candidate
        response = requests.post(
            f"{BASE_URL}/api/call/signal",
            json={
                "call_id": call_id,
                "caller_id": "caller6",
                "target_user_id": "receiver6",
                "signal_type": "ice_candidate",
                "signal_data": {
                    "candidate": "candidate:123 1 udp 2122260223 192.168.1.1 51234 typ host",
                    "sdpMid": "0",
                    "sdpMLineIndex": 0
                }
            }
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/call/end", json={
            "call_id": call_id,
            "target_user_id": "receiver6",
            "caller_id": "caller6"
        })
    
    def test_call_not_found(self):
        """Test status for non-existent call"""
        response = requests.get(f"{BASE_URL}/api/call/status/non-existent-call-id")
        assert response.status_code == 200
        data = response.json()
        assert data["call"] is None
        assert data["error"] == "Call not found"
    
    def test_end_nonexistent_call(self):
        """Test ending a non-existent call"""
        response = requests.post(
            f"{BASE_URL}/api/call/end",
            json={
                "call_id": "nonexistent-call",
                "target_user_id": "user1",
                "caller_id": "user2"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert data["error"] == "Call not found"


class TestSSEChatStream:
    """Tests for SSE chat stream endpoint"""
    
    def test_chat_stream_endpoint_exists(self):
        """Test that SSE chat stream endpoint exists"""
        # SSE endpoints are special - we just verify it returns proper headers
        response = requests.get(
            f"{BASE_URL}/api/chat/stream/test-user-id",
            stream=True,
            timeout=5
        )
        assert response.status_code == 200
        assert 'text/event-stream' in response.headers.get('content-type', '')
        response.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
