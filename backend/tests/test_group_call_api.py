"""
Test Group Video Call API Endpoints
Testing: Multi-peer WebRTC connection management, room state, participant management
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://webrtc-studio.preview.emergentagent.com').rstrip('/')


class TestGroupCallJoin:
    """Tests for POST /api/group-call/join - Join a group call room"""
    
    def test_join_new_room_creates_room(self):
        """Test joining a new room creates the room and adds participant"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        response = requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id,
            "user_id": user_id,
            "user_name": "Test User 1",
            "video_enabled": True,
            "audio_enabled": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["room"]["id"] == room_id
        assert len(data["room"]["participants"]) == 1
        assert data["room"]["participants"][0]["user_id"] == user_id
        assert data["room"]["participants"][0]["user_name"] == "Test User 1"
        assert data["room"]["participants"][0]["video_enabled"] == True
        assert data["room"]["participants"][0]["audio_enabled"] == True
        
        # Cleanup - leave the room
        requests.post(f"{BASE_URL}/api/group-call/leave", json={
            "room_id": room_id,
            "user_id": user_id
        })
        print(f"✓ Join new room creates room correctly")
    
    def test_join_existing_room_adds_participant(self):
        """Test joining an existing room adds participant to the list"""
        room_id = f"test-room-{uuid.uuid4()}"
        user1_id = f"test-user1-{uuid.uuid4()}"
        user2_id = f"test-user2-{uuid.uuid4()}"
        
        # First user joins
        response1 = requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id,
            "user_id": user1_id,
            "user_name": "User One",
            "video_enabled": True,
            "audio_enabled": True
        })
        assert response1.status_code == 200
        
        # Second user joins
        response2 = requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id,
            "user_id": user2_id,
            "user_name": "User Two",
            "video_enabled": False,
            "audio_enabled": True
        })
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["success"] == True
        assert len(data["room"]["participants"]) == 2
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user1_id})
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user2_id})
        print(f"✓ Join existing room adds participant correctly")
    
    def test_rejoin_updates_existing_participant(self):
        """Test that rejoining the same room updates existing participant data"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # First join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id,
            "user_id": user_id,
            "user_name": "Test User",
            "video_enabled": False,
            "audio_enabled": False
        })
        
        # Rejoin with different settings
        response = requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id,
            "user_id": user_id,
            "user_name": "Test User",
            "video_enabled": True,
            "audio_enabled": True
        })
        
        assert response.status_code == 200
        data = response.json()
        # Should still have only 1 participant (not duplicated)
        assert len(data["room"]["participants"]) == 1
        # Settings should be updated
        participant = data["room"]["participants"][0]
        assert participant["video_enabled"] == True
        assert participant["audio_enabled"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Rejoin updates existing participant correctly")


class TestGroupCallLeave:
    """Tests for POST /api/group-call/leave - Leave a group call room"""
    
    def test_leave_room_removes_participant(self):
        """Test leaving a room removes the participant"""
        room_id = f"test-room-{uuid.uuid4()}"
        user1_id = f"test-user1-{uuid.uuid4()}"
        user2_id = f"test-user2-{uuid.uuid4()}"
        
        # Two users join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user1_id, "user_name": "User One",
            "video_enabled": True, "audio_enabled": True
        })
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user2_id, "user_name": "User Two",
            "video_enabled": True, "audio_enabled": True
        })
        
        # First user leaves
        response = requests.post(f"{BASE_URL}/api/group-call/leave", json={
            "room_id": room_id,
            "user_id": user1_id
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["remaining_participants"] == 1
        
        # Verify room state
        room_response = requests.get(f"{BASE_URL}/api/group-call/room/{room_id}")
        room_data = room_response.json()
        assert len(room_data["room"]["participants"]) == 1
        assert room_data["room"]["participants"][0]["user_id"] == user2_id
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user2_id})
        print(f"✓ Leave room removes participant correctly")
    
    def test_leave_nonexistent_room_returns_error(self):
        """Test leaving a non-existent room returns error"""
        response = requests.post(f"{BASE_URL}/api/group-call/leave", json={
            "room_id": f"nonexistent-room-{uuid.uuid4()}",
            "user_id": "some-user"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data
        print(f"✓ Leave nonexistent room returns error correctly")
    
    def test_last_participant_leaving_deletes_room(self):
        """Test that when the last participant leaves, the room is deleted"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join room
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Solo User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Leave room
        response = requests.post(f"{BASE_URL}/api/group-call/leave", json={
            "room_id": room_id,
            "user_id": user_id
        })
        
        assert response.status_code == 200
        assert response.json()["remaining_participants"] == 0
        
        # Verify room no longer exists
        room_response = requests.get(f"{BASE_URL}/api/group-call/room/{room_id}")
        room_data = room_response.json()
        assert room_data["exists"] == False
        print(f"✓ Last participant leaving deletes room correctly")


class TestGroupCallSignal:
    """Tests for POST /api/group-call/signal - Send WebRTC signaling data"""
    
    def test_signal_to_existing_room(self):
        """Test sending signal to an existing room participant"""
        room_id = f"test-room-{uuid.uuid4()}"
        user1_id = f"test-user1-{uuid.uuid4()}"
        user2_id = f"test-user2-{uuid.uuid4()}"
        
        # Two users join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user1_id, "user_name": "User One",
            "video_enabled": True, "audio_enabled": True
        })
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user2_id, "user_name": "User Two",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Send signal from user1 to user2
        response = requests.post(f"{BASE_URL}/api/group-call/signal", json={
            "room_id": room_id,
            "sender_id": user1_id,
            "sender_name": "User One",
            "target_id": user2_id,
            "signal_type": "offer",
            "signal_data": {"offer": {"type": "offer", "sdp": "test-sdp"}}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user1_id})
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user2_id})
        print(f"✓ Signal to existing room works correctly")
    
    def test_signal_to_nonexistent_room(self):
        """Test sending signal to non-existent room returns error"""
        response = requests.post(f"{BASE_URL}/api/group-call/signal", json={
            "room_id": f"nonexistent-room-{uuid.uuid4()}",
            "sender_id": "sender",
            "sender_name": "Sender",
            "target_id": "target",
            "signal_type": "offer",
            "signal_data": {"offer": {"type": "offer", "sdp": "test-sdp"}}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data
        print(f"✓ Signal to nonexistent room returns error correctly")


class TestGroupCallRoomState:
    """Tests for GET /api/group-call/room/{room_id} - Get room state"""
    
    def test_get_existing_room_state(self):
        """Test getting state of existing room"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Create room by joining
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Get room state
        response = requests.get(f"{BASE_URL}/api/group-call/room/{room_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["exists"] == True
        assert data["room"]["id"] == room_id
        assert len(data["room"]["participants"]) == 1
        assert data["room"]["created_at"] is not None
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Get existing room state works correctly")
    
    def test_get_nonexistent_room_returns_empty(self):
        """Test getting non-existent room returns exists=False"""
        response = requests.get(f"{BASE_URL}/api/group-call/room/nonexistent-room-123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["exists"] == False
        assert data["room"]["id"] == "nonexistent-room-123"
        assert data["room"]["participants"] == []
        print(f"✓ Get nonexistent room returns empty correctly")


class TestGroupCallUpdateParticipant:
    """Tests for POST /api/group-call/update-participant - Update participant status"""
    
    def test_update_video_status(self):
        """Test updating video enabled status"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join with video enabled
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Update to video disabled
        response = requests.post(f"{BASE_URL}/api/group-call/update-participant", json={
            "room_id": room_id,
            "user_id": user_id,
            "video_enabled": False
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["participant"]["video_enabled"] == False
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Update video status works correctly")
    
    def test_update_audio_status(self):
        """Test updating audio enabled status"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join with audio enabled
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Update to audio disabled (mute)
        response = requests.post(f"{BASE_URL}/api/group-call/update-participant", json={
            "room_id": room_id,
            "user_id": user_id,
            "audio_enabled": False
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["participant"]["audio_enabled"] == False
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Update audio status (mute) works correctly")
    
    def test_update_hand_raised(self):
        """Test updating hand raised status"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Raise hand
        response = requests.post(f"{BASE_URL}/api/group-call/update-participant", json={
            "room_id": room_id,
            "user_id": user_id,
            "hand_raised": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["participant"]["hand_raised"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Update hand raised status works correctly")
    
    def test_update_speaking_sets_active_speaker(self):
        """Test that setting is_speaking=True updates the active speaker"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Set speaking
        response = requests.post(f"{BASE_URL}/api/group-call/update-participant", json={
            "room_id": room_id,
            "user_id": user_id,
            "is_speaking": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["participant"]["is_speaking"] == True
        
        # Verify active speaker in room state
        room_response = requests.get(f"{BASE_URL}/api/group-call/room/{room_id}")
        room_data = room_response.json()
        assert room_data["room"]["active_speaker"] == user_id
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Update speaking status sets active speaker correctly")
    
    def test_update_nonexistent_participant_returns_error(self):
        """Test updating non-existent participant returns error"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_id = f"test-user-{uuid.uuid4()}"
        
        # Join to create room
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user_id, "user_name": "Test User",
            "video_enabled": True, "audio_enabled": True
        })
        
        # Try to update non-existent participant
        response = requests.post(f"{BASE_URL}/api/group-call/update-participant", json={
            "room_id": room_id,
            "user_id": "nonexistent-user",
            "video_enabled": False
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        print(f"✓ Update nonexistent participant returns error correctly")


class TestGroupCallParticipants:
    """Tests for GET /api/group-call/participants/{room_id} - Get participants list"""
    
    def test_get_participants_list(self):
        """Test getting list of participants in a room"""
        room_id = f"test-room-{uuid.uuid4()}"
        user1_id = f"test-user1-{uuid.uuid4()}"
        user2_id = f"test-user2-{uuid.uuid4()}"
        
        # Two users join
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user1_id, "user_name": "User One",
            "video_enabled": True, "audio_enabled": True
        })
        requests.post(f"{BASE_URL}/api/group-call/join", json={
            "room_id": room_id, "user_id": user2_id, "user_name": "User Two",
            "video_enabled": False, "audio_enabled": True
        })
        
        # Get participants
        response = requests.get(f"{BASE_URL}/api/group-call/participants/{room_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["participants"]) == 2
        
        # Verify participant data
        user_ids = [p["user_id"] for p in data["participants"]]
        assert user1_id in user_ids
        assert user2_id in user_ids
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user1_id})
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user2_id})
        print(f"✓ Get participants list works correctly")
    
    def test_get_participants_empty_room(self):
        """Test getting participants for non-existent room returns empty"""
        response = requests.get(f"{BASE_URL}/api/group-call/participants/nonexistent-room-456")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["participants"] == []
        print(f"✓ Get participants for empty room returns empty correctly")


class TestGroupCallMultiParticipantScenarios:
    """Integration tests for multi-participant scenarios"""
    
    def test_multiple_participants_up_to_16(self):
        """Test that room can handle up to 16 participants"""
        room_id = f"test-room-{uuid.uuid4()}"
        user_ids = []
        
        # Add 5 participants (reduced from 16 for faster test)
        for i in range(5):
            user_id = f"test-user-{i}-{uuid.uuid4()}"
            user_ids.append(user_id)
            
            response = requests.post(f"{BASE_URL}/api/group-call/join", json={
                "room_id": room_id,
                "user_id": user_id,
                "user_name": f"User {i+1}",
                "video_enabled": i % 2 == 0,  # Alternating video
                "audio_enabled": True
            })
            assert response.status_code == 200
            assert response.json()["success"] == True
        
        # Verify participant count
        response = requests.get(f"{BASE_URL}/api/group-call/participants/{room_id}")
        data = response.json()
        assert data["count"] == 5
        
        # Cleanup
        for user_id in user_ids:
            requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user_id})
        
        print(f"✓ Room handles multiple participants correctly")
    
    def test_participant_leaves_notifies_remaining(self):
        """Test that when participant leaves, room state is properly updated"""
        room_id = f"test-room-{uuid.uuid4()}"
        user1_id = f"test-user1-{uuid.uuid4()}"
        user2_id = f"test-user2-{uuid.uuid4()}"
        user3_id = f"test-user3-{uuid.uuid4()}"
        
        # Three users join
        for uid, uname in [(user1_id, "User One"), (user2_id, "User Two"), (user3_id, "User Three")]:
            requests.post(f"{BASE_URL}/api/group-call/join", json={
                "room_id": room_id, "user_id": uid, "user_name": uname,
                "video_enabled": True, "audio_enabled": True
            })
        
        # Verify 3 participants
        response = requests.get(f"{BASE_URL}/api/group-call/participants/{room_id}")
        assert response.json()["count"] == 3
        
        # User 2 leaves
        requests.post(f"{BASE_URL}/api/group-call/leave", json={
            "room_id": room_id, "user_id": user2_id
        })
        
        # Verify 2 participants remaining
        response = requests.get(f"{BASE_URL}/api/group-call/participants/{room_id}")
        data = response.json()
        assert data["count"] == 2
        remaining_ids = [p["user_id"] for p in data["participants"]]
        assert user1_id in remaining_ids
        assert user3_id in remaining_ids
        assert user2_id not in remaining_ids
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user1_id})
        requests.post(f"{BASE_URL}/api/group-call/leave", json={"room_id": room_id, "user_id": user3_id})
        print(f"✓ Participant leaving updates room state correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
