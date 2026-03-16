"""
Admin Portal Enhancements - Backend API Tests
Tests for Admin Workspace Management, Chat Moderation, and Shift Management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ir-sor-advanced.preview.emergentagent.com').rstrip('/')


class TestAdminWorkspacesAPI:
    """Tests for Admin Workspace Management API - /api/admin/workspaces/*"""
    
    def test_get_workspace_stats(self):
        """Test GET /api/admin/workspaces/stats - returns overall workspace statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "stats" in data
        stats = data["stats"]
        
        # Verify all required fields
        assert "total_workspaces" in stats
        assert "active_workspaces" in stats
        assert "suspended_workspaces" in stats
        assert "archived_workspaces" in stats
        assert "new_this_month" in stats
        assert "total_members" in stats
        assert "total_messages" in stats
        assert "total_shifts" in stats
        
        # Verify values are non-negative integers
        assert isinstance(stats["total_workspaces"], int)
        assert stats["total_workspaces"] >= 0
        print(f"✓ Workspace stats: {stats['total_workspaces']} total, {stats['active_workspaces']} active")
    
    def test_get_all_workspaces(self):
        """Test GET /api/admin/workspaces - returns list of all workspaces with pagination"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "workspaces" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data
        
        # Verify workspace structure
        if len(data["workspaces"]) > 0:
            ws = data["workspaces"][0]
            assert "id" in ws
            assert "name" in ws
            assert "member_count" in ws
            assert "message_count" in ws
            assert "shift_count" in ws
            assert "owner" in ws
            assert "status" in ws
            print(f"✓ Workspaces list: {len(data['workspaces'])} workspaces on page {data['page']}")
    
    def test_workspaces_search_filter(self):
        """Test GET /api/admin/workspaces with search parameter"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces?search=workspace")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Search filter works: found {len(data['workspaces'])} matching workspaces")
    
    def test_workspaces_status_filter(self):
        """Test GET /api/admin/workspaces with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces?status=active")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # All returned workspaces should have 'active' status
        for ws in data["workspaces"]:
            assert ws.get("status", "active") == "active"
        print(f"✓ Status filter works: {len(data['workspaces'])} active workspaces")
    
    def test_get_workspace_details(self):
        """Test GET /api/admin/workspaces/{id} - returns detailed workspace info"""
        # First get a workspace ID
        response = requests.get(f"{BASE_URL}/api/admin/workspaces?limit=1")
        data = response.json()
        
        if data["workspaces"]:
            workspace_id = data["workspaces"][0]["id"]
            
            detail_response = requests.get(f"{BASE_URL}/api/admin/workspaces/{workspace_id}")
            assert detail_response.status_code == 200
            detail_data = detail_response.json()
            
            assert detail_data["success"] == True
            assert "workspace" in detail_data
            ws = detail_data["workspace"]
            
            assert ws["id"] == workspace_id
            assert "owner" in ws
            assert "members" in ws
            assert "stats" in ws
            print(f"✓ Workspace detail: {ws['name']} with {ws['stats']['member_count']} members")
        else:
            pytest.skip("No workspaces available for testing")
    
    def test_get_workspace_members(self):
        """Test GET /api/admin/workspaces/{id}/members"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces?limit=1")
        data = response.json()
        
        if data["workspaces"]:
            workspace_id = data["workspaces"][0]["id"]
            
            members_response = requests.get(f"{BASE_URL}/api/admin/workspaces/{workspace_id}/members")
            assert members_response.status_code == 200
            members_data = members_response.json()
            
            assert members_data["success"] == True
            assert "members" in members_data
            print(f"✓ Members endpoint: {len(members_data['members'])} members")
        else:
            pytest.skip("No workspaces available for testing")
    
    def test_workspace_not_found(self):
        """Test GET /api/admin/workspaces/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces/invalid-id-12345")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent workspace")


class TestAdminChatModerationAPI:
    """Tests for Admin Chat Moderation API - /api/admin/chat-moderation/*"""
    
    def test_get_moderation_stats(self):
        """Test GET /api/admin/chat-moderation/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-moderation/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "stats" in data
        stats = data["stats"]
        
        # Verify all required fields
        assert "total_messages" in stats
        assert "flagged_messages" in stats
        assert "deleted_messages" in stats
        assert "messages_today" in stats
        assert "messages_this_week" in stats
        assert "active_chat_workspaces" in stats
        assert "moderation_actions_this_month" in stats
        
        print(f"✓ Chat moderation stats: {stats['total_messages']} total, {stats['flagged_messages']} flagged")
    
    def test_get_messages_for_moderation(self):
        """Test GET /api/admin/chat-moderation/messages"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-moderation/messages")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "messages" in data
        assert "total" in data
        assert "page" in data
        assert "total_pages" in data
        print(f"✓ Messages for moderation: {data['total']} total messages")
    
    def test_get_flagged_messages(self):
        """Test GET /api/admin/chat-moderation/flagged"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-moderation/flagged")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "messages" in data
        assert "total" in data
        print(f"✓ Flagged messages: {data['total']} flagged")
    
    def test_get_chat_analytics(self):
        """Test GET /api/admin/chat-moderation/analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-moderation/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "analytics" in data
        analytics = data["analytics"]
        
        assert "daily_messages" in analytics
        assert "top_workspaces" in analytics
        assert "top_users" in analytics
        print(f"✓ Chat analytics: {len(analytics['top_workspaces'])} top workspaces, {len(analytics['top_users'])} top users")
    
    def test_get_moderation_logs(self):
        """Test GET /api/admin/chat-moderation/logs"""
        response = requests.get(f"{BASE_URL}/api/admin/chat-moderation/logs")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "logs" in data
        assert "total" in data
        print(f"✓ Moderation logs: {data['total']} log entries")


class TestAdminShiftsAPI:
    """Tests for Admin Shift Management API - /api/admin/shifts/*"""
    
    def test_get_shift_stats(self):
        """Test GET /api/admin/shifts/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "stats" in data
        stats = data["stats"]
        
        # Verify all required fields
        assert "total_shifts" in stats
        assert "shifts_today" in stats
        assert "active_shifts" in stats
        assert "cancelled_shifts" in stats
        assert "unassigned_shifts" in stats
        assert "shifts_this_week" in stats
        assert "total_hours_this_month" in stats
        assert "total_clock_ins" in stats
        
        print(f"✓ Shift stats: {stats['total_shifts']} total, {stats['shifts_today']} today, {stats['active_shifts']} active")
    
    def test_get_todays_shifts(self):
        """Test GET /api/admin/shifts/today"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts/today")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "date" in data
        assert "total_shifts" in data
        assert "shifts" in data
        assert "by_workspace" in data
        
        # Verify shift structure if shifts exist
        if data["shifts"]:
            shift = data["shifts"][0]
            assert "id" in shift
            assert "date" in shift
            assert "start_time" in shift
            assert "end_time" in shift
            assert "workspace" in shift
        
        print(f"✓ Today's shifts: {data['total_shifts']} shifts for {data['date']}")
    
    def test_get_all_shifts(self):
        """Test GET /api/admin/shifts - list all shifts"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "shifts" in data
        assert "total" in data
        assert "page" in data
        assert "total_pages" in data
        
        print(f"✓ All shifts: {data['total']} total shifts")
    
    def test_get_shifts_with_filters(self):
        """Test GET /api/admin/shifts with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts?status=scheduled")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Filtered shifts: {len(data['shifts'])} scheduled shifts")
    
    def test_get_timesheets(self):
        """Test GET /api/admin/shifts/timesheets"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts/timesheets")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "entries" in data
        assert "total" in data
        assert "page" in data
        
        print(f"✓ Timesheets: {data['total']} timesheet entries")
    
    def test_get_shift_analytics(self):
        """Test GET /api/admin/shifts/analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "analytics" in data
        analytics = data["analytics"]
        
        assert "daily_shifts" in analytics
        assert "workspace_hours" in analytics
        assert "top_workers" in analytics
        assert "status_breakdown" in analytics
        
        print(f"✓ Shift analytics: {len(analytics['workspace_hours'])} workspace stats, {len(analytics['top_workers'])} top workers")
    
    def test_export_shifts(self):
        """Test GET /api/admin/shifts/export"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts/export")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "export" in data
        export = data["export"]
        
        assert "generated_at" in export
        assert "total_records" in export
        assert "data" in export
        
        print(f"✓ Export endpoint: {export['total_records']} records exported")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
