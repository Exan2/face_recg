#!/usr/bin/env python3
import requests
import time
import sys

def test_service(url, name):
    try:
        print(f"Testing {name} at {url}...")
        response = requests.get(url, timeout=5)
        print(f"✅ {name}: Status {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Response: {data}")
            except:
                print(f"   Response: {response.text[:100]}...")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection refused")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def main():
    print("🔍 Testing Face Recognition System Services...")
    print("=" * 50)
    
    # Test Node.js backend
    backend_ok = test_service("http://localhost:5000/api/employees", "Node.js Backend")
    
    # Test Python face recognition service
    python_ok = test_service("http://localhost:8000/health", "Python Face Recognition")
    
    print("=" * 50)
    if backend_ok and python_ok:
        print("✅ All services are running!")
        print("\nYou can now try scanning your face in the web interface.")
    else:
        print("❌ Some services are not running.")
        print("\nPlease check the service logs and ensure all services are started.")
        if not backend_ok:
            print("- Start the Node.js backend: cd server && npm run dev")
        if not python_ok:
            print("- Start the Python service: cd python_service && python real_face_service.py")

if __name__ == "__main__":
    main()

