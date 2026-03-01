#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class EchoNoteAPITester:
    def __init__(self, base_url="https://munal-preview-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_time": response.elapsed.total_seconds(),
                "url": url
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_json = response.json()
                    print(f"   Response: {json.dumps(response_json, indent=2)}")
                    result["response_data"] = response_json
                except:
                    result["response_data"] = response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                result["error_message"] = response.text

            self.test_results.append(result)
            return success, response.json() if success and response.content else {}

        except requests.exceptions.ConnectionError as e:
            print(f"❌ FAILED - Connection Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "success": False,
                "error_message": f"Connection Error: {str(e)}",
                "url": url
            }
            self.test_results.append(result)
            return False, {}
        except requests.exceptions.Timeout as e:
            print(f"❌ FAILED - Timeout Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "success": False,
                "error_message": f"Timeout Error: {str(e)}",
                "url": url
            }
            self.test_results.append(result)
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "success": False,
                "error_message": f"Error: {str(e)}",
                "url": url
            }
            self.test_results.append(result)
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root Endpoint",
            "GET", 
            "api/",
            200
        )

    def test_get_status_checks(self):
        """Test getting status checks"""
        return self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )

    def test_create_status_check(self):
        """Test creating a status check"""
        test_data = {
            "client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"
        }
        
        return self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data=test_data
        )

    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404"""
        return self.run_test(
            "Invalid Endpoint",
            "GET",
            "api/invalid-endpoint",
            404
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting EchoNote AI Backend API Tests")
        print("=" * 50)
        
        # Test basic connectivity
        basic_success, _ = self.test_api_root()
        if not basic_success:
            print("\n❌ CRITICAL: API Root endpoint failed. Backend may not be running.")
            return False
            
        # Run CRUD tests
        self.test_get_status_checks()
        self.test_create_status_check()
        self.test_invalid_endpoint()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed != self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test_name']}: {result.get('error_message', 'Unknown error')}")
        else:
            print("\n✅ All tests passed!")

def main():
    """Main test runner"""
    tester = EchoNoteAPITester()
    
    # Run all tests
    if not tester.run_all_tests():
        tester.print_summary()
        return 1
    
    tester.print_summary()
    
    # Return 0 if all tests passed, 1 if any failed
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())