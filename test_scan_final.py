#!/usr/bin/env python3
import requests
import os
from PIL import Image
import io

def create_test_image():
    """Create a simple test image"""
    # Create a simple 100x100 image
    img = Image.new('RGB', (100, 100), color='white')
    return img

def test_scan_api():
    print("🔍 Testing scan API with working Python service")
    
    try:
        # Create a simple test image
        test_img = create_test_image()
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        test_img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Test the scan API
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        response = requests.post('http://localhost:5000/api/scan/recognize', files=files, timeout=30)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Response: {data}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📋 Error details: {error_data}")
            except:
                print(f"📋 Error text: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on port 5000?")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_scan_api()
