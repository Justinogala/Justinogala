"""
GEO (Generative Engine Optimization) Endpoints Tests
Tests for llms.txt, ai-plugin.json, and related GEO features
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGEOEndpoints:
    """Tests for GEO-related endpoints"""
    
    def test_llms_txt_returns_content(self):
        """GET /llms.txt returns full Munal AI description in text/plain format"""
        response = requests.get(f"{BASE_URL}/llms.txt")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/plain" in response.headers.get("content-type", ""), "Content-Type should be text/plain"
        
        content = response.text
        assert "Munal AI" in content, "Content should mention Munal AI"
        assert "LLMs.txt" in content, "Content should have LLMs.txt header"
        assert "AI Meeting Summaries" in content, "Content should mention AI Meeting Summaries"
        assert "Smart Shift Management" in content, "Content should mention Smart Shift Management"
        assert "eSignatures" in content, "Content should mention eSignatures"
        assert "DocHub" in content, "Content should mention DocHub"
        assert "Healthcare" in content, "Content should mention Healthcare industry"
        assert "Education" in content, "Content should mention Education industry"
        assert "Legal" in content, "Content should mention Legal industry"
        assert "Finance" in content, "Content should mention Finance industry"
        print("PASS: /llms.txt returns full content with all expected sections")
    
    def test_llms_full_txt_returns_content(self):
        """GET /llms-full.txt returns same content as llms.txt"""
        response = requests.get(f"{BASE_URL}/llms-full.txt")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/plain" in response.headers.get("content-type", ""), "Content-Type should be text/plain"
        
        content = response.text
        assert "Munal AI" in content, "Content should mention Munal AI"
        assert "LLMs.txt" in content, "Content should have LLMs.txt header"
        print("PASS: /llms-full.txt returns content")
    
    def test_ai_plugin_json_valid(self):
        """GET /.well-known/ai-plugin.json returns valid JSON with required fields"""
        response = requests.get(f"{BASE_URL}/.well-known/ai-plugin.json")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/json" in response.headers.get("content-type", ""), "Content-Type should be application/json"
        
        data = response.json()
        
        # Required fields for AI plugin manifest
        assert "name_for_human" in data, "Should have name_for_human field"
        assert data["name_for_human"] == "Munal AI", f"name_for_human should be 'Munal AI', got {data['name_for_human']}"
        
        assert "name_for_model" in data, "Should have name_for_model field"
        assert data["name_for_model"] == "munal_ai", f"name_for_model should be 'munal_ai', got {data['name_for_model']}"
        
        assert "description_for_human" in data, "Should have description_for_human field"
        assert len(data["description_for_human"]) > 50, "description_for_human should be substantial"
        
        assert "description_for_model" in data, "Should have description_for_model field"
        assert len(data["description_for_model"]) > 100, "description_for_model should be detailed"
        assert "Healthcare" in data["description_for_model"], "description_for_model should mention Healthcare"
        
        assert "schema_version" in data, "Should have schema_version field"
        assert "auth" in data, "Should have auth field"
        assert "api" in data, "Should have api field"
        
        print("PASS: /.well-known/ai-plugin.json returns valid JSON with all required fields")
    
    def test_api_health_check(self):
        """Verify API is healthy before running other tests"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", "API should be healthy"
        print("PASS: API health check passed")


class TestGEOContentQuality:
    """Tests for GEO content quality and completeness"""
    
    def test_llms_txt_has_industry_solutions(self):
        """Verify llms.txt has all 4 industry solution sections"""
        response = requests.get(f"{BASE_URL}/llms.txt")
        content = response.text
        
        # Check for Industry Solutions section
        assert "## Industry Solutions" in content, "Should have Industry Solutions section"
        
        # Check each industry
        industries = ["Healthcare", "Education", "Legal", "Finance"]
        for industry in industries:
            assert f"### {industry}" in content, f"Should have {industry} subsection"
        
        print("PASS: llms.txt has all 4 industry solution sections")
    
    def test_llms_txt_has_links(self):
        """Verify llms.txt has solution page links"""
        response = requests.get(f"{BASE_URL}/llms.txt")
        content = response.text
        
        expected_links = [
            "https://munal.ai/solutions/healthcare",
            "https://munal.ai/solutions/education",
            "https://munal.ai/solutions/legal",
            "https://munal.ai/solutions/finance"
        ]
        
        for link in expected_links:
            assert link in content, f"Should have link to {link}"
        
        print("PASS: llms.txt has all solution page links")
    
    def test_ai_plugin_mentions_industries(self):
        """Verify ai-plugin.json description mentions all industries"""
        response = requests.get(f"{BASE_URL}/.well-known/ai-plugin.json")
        data = response.json()
        
        description = data.get("description_for_model", "")
        
        industries = ["Healthcare", "Education", "Legal", "Finance"]
        for industry in industries:
            assert industry in description, f"description_for_model should mention {industry}"
        
        print("PASS: ai-plugin.json mentions all industries")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
