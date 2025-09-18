#!/usr/bin/env python3
"""
Test script for real face recognition
This script demonstrates how to use the face recognition system
"""

import requests
import base64
import json
from PIL import Image
import io

def test_face_encoding(image_path):
    """Test face encoding with an image"""
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Send to encoding endpoint
        files = {'image': ('test.jpg', image_data, 'image/jpeg')}
        response = requests.post('http://localhost:8000/encode', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Face encoding successful!")
            print(f"   Face location: {result.get('face_location')}")
            return result.get('face_encoding')
        else:
            print(f"❌ Face encoding failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing face encoding: {e}")
        return None

def test_face_recognition(image_path):
    """Test face recognition with an image"""
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Send to recognition endpoint
        files = {'image': ('test.jpg', image_data, 'image/jpeg')}
        response = requests.post('http://localhost:8000/recognize', files=files)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('recognized'):
                print(f"✅ Face recognized!")
                print(f"   Employee: {result.get('employee', {}).get('name', 'Unknown')}")
                print(f"   Confidence: {result.get('confidence', 0):.2f}")
                print(f"   Face location: {result.get('face_location')}")
            else:
                print(f"❌ Face not recognized")
                print(f"   Confidence: {result.get('confidence', 0):.2f}")
                print(f"   Message: {result.get('message')}")
        else:
            print(f"❌ Face recognition failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing face recognition: {e}")

def test_service_health():
    """Test if the service is running"""
    try:
        response = requests.get('http://localhost:8000/health')
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Service is healthy!")
            print(f"   Status: {result.get('status')}")
            print(f"   Loaded faces: {result.get('loaded_faces')}")
            print(f"   Face detection ready: {result.get('face_detection_ready')}")
            return True
        else:
            print(f"❌ Service health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Service not running: {e}")
        return False

def main():
    print("🧪 Testing Real Face Recognition System")
    print("=" * 50)
    
    # Test service health
    print("\n1. Testing service health...")
    if not test_service_health():
        print("❌ Service is not running. Please start the service first.")
        return
    
    # Test face encoding
    print("\n2. Testing face encoding...")
    print("   (This would test encoding if you had a test image)")
    print("   To test: python test_face_recognition.py encode path/to/your/photo.jpg")
    
    # Test face recognition
    print("\n3. Testing face recognition...")
    print("   (This would test recognition if you had a test image)")
    print("   To test: python test_face_recognition.py recognize path/to/your/photo.jpg")
    
    print("\n📋 How to use the system:")
    print("1. Start all services: test_real_face_recognition.bat")
    print("2. Open browser: http://localhost:3000")
    print("3. Add employees with photos in Admin Dashboard")
    print("4. Test recognition in User Access mode")
    print("5. Use webcam or upload photos for testing")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 2:
        command = sys.argv[1]
        image_path = sys.argv[2]
        
        if command == "encode":
            test_face_encoding(image_path)
        elif command == "recognize":
            test_face_recognition(image_path)
        else:
            print("Usage: python test_face_recognition.py [encode|recognize] <image_path>")
    else:
        main()
