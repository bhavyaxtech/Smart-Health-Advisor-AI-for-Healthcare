
import requests
import sys
import json
from datetime import datetime

class HealthAssistantAPITester:
    def __init__(self, base_url="https://b009155b-15a1-4790-8c50-71b1609e26e9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except json.JSONDecodeError:
                        return success, response.text
                return success, None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        success, response = self.run_test(
            "Health Check Endpoint",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"Health check response: {response}")
        return success

    def test_analyze_symptom(self, symptom, duration="", severity="", additional_info=""):
        """Test the symptom analysis endpoint"""
        test_name = f"Analyze Symptom: '{symptom}'"
        data = {
            "symptom": symptom,
            "duration": duration,
            "severity": severity,
            "additional_info": additional_info
        }
        
        success, response = self.run_test(
            test_name,
            "POST",
            "api/analyze-symptom",
            200,
            data=data
        )
        
        if success:
            # Validate response structure
            required_fields = [
                "symptom_analysis", "diet_plan", "possible_causes", 
                "lifestyle_suggestions", "red_flags", "medical_disclaimer"
            ]
            
            valid_structure = all(field in response for field in required_fields)
            
            if valid_structure:
                print("✅ Response structure is valid")
                
                # Validate diet plan structure
                diet_plan = response["diet_plan"]
                diet_fields = ["foods_to_consume", "foods_to_avoid", "nutritional_focus", "meal_suggestions"]
                valid_diet = all(field in diet_plan for field in diet_fields)
                
                if valid_diet:
                    print("✅ Diet plan structure is valid")
                    # Print some sample data
                    print(f"Foods to consume: {diet_plan['foods_to_consume'][:2]}...")
                    print(f"Foods to avoid: {diet_plan['foods_to_avoid'][:2]}...")
                else:
                    print("❌ Diet plan structure is invalid")
                    return False
                
                # Validate possible causes
                causes = response["possible_causes"]
                if causes and isinstance(causes, list):
                    print(f"✅ Found {len(causes)} possible causes")
                    if causes:
                        sample_cause = causes[0]
                        print(f"Sample cause: {sample_cause['condition']} (Probability: {sample_cause['probability']})")
                else:
                    print("❌ Possible causes structure is invalid")
                    return False
                
                return True
            else:
                print("❌ Response structure is invalid")
                print(f"Missing fields: {[f for f in required_fields if f not in response]}")
                return False
        
        return False

def main():
    # Setup
    tester = HealthAssistantAPITester()
    
    # Test health endpoint
    if not tester.test_health_endpoint():
        print("❌ Health endpoint test failed, stopping tests")
        return 1
    
    # Test symptom analysis with different symptoms
    test_symptoms = [
        {"symptom": "headache", "duration": "1-3 days", "severity": "moderate"},
        {"symptom": "nausea", "duration": "less than 1 hour", "severity": "mild"},
        {"symptom": "fatigue", "duration": "more than 2 weeks", "severity": "severe"},
        {"symptom": "stomach pain", "duration": "", "severity": ""}  # Minimal fields
    ]
    
    for test_case in test_symptoms:
        if not tester.test_analyze_symptom(**test_case):
            print(f"❌ Symptom analysis test failed for {test_case['symptom']}")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
