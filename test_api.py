import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health Check Status: {response.status_code}")
        print(f"Health Check Response: {response.text}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_analyze_symptom():
    url = f"{BASE_URL}/api/analyze-symptom"
    data = {
        "symptom": "headache",
        "duration": "6-24 hours",
        "severity": "moderate",
        "additional_info": "Test from script"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Analyze Symptom Status: {response.status_code}")
        print(f"Analyze Symptom Response: {response.text}")
    except Exception as e:
        print(f"Analyze Symptom Failed: {e}")

if __name__ == "__main__":
    print("Testing API...")
    test_health()
    print("-" * 20)
    test_analyze_symptom()
