#!/usr/bin/env python3
"""
Setup script for Face Recognition Employee System
This script will install all dependencies and set up the system
"""

import subprocess
import sys
import os
import platform

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd, capture_output=True, text=True)
        print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🚀 Setting up Face Recognition Employee System...")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install Node.js dependencies
    print("\n📦 Installing Node.js dependencies...")
    if not run_command("npm install", cwd="client"):
        print("❌ Failed to install client dependencies")
        return False
    
    if not run_command("npm install", cwd="server"):
        print("❌ Failed to install server dependencies")
        return False
    
    # Install Python dependencies
    print("\n🐍 Installing Python dependencies...")
    if not run_command("pip install -r python_service/requirements.txt"):
        print("❌ Failed to install Python dependencies")
        return False
    
    # Create necessary directories
    print("\n📁 Creating directories...")
    directories = [
        "server/uploads/employees",
        "server/uploads/scans",
        "client/out"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created {directory}")
    
    # Create .env file for server
    print("\n⚙️ Creating environment files...")
    env_content = """# Database Configuration
DB_NAME=face_rec
DB_USER=exan
DB_PASSWORD=exan
DB_HOST=localhost
DB_PORT=5432

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Python Face Recognition Service
PYTHON_SERVICE_URL=http://localhost:8000

# DroidCam Configuration
DROIDCAM_IP=192.168.1.100
DROIDCAM_PORT=4747
"""
    
    with open("server/.env", "w") as f:
        f.write(env_content)
    print("✅ Created server/.env")
    
    # Create .env file for Python service
    python_env_content = """# Backend API URL
BACKEND_URL=http://localhost:5000

# Face Recognition Configuration
CONFIDENCE_THRESHOLD=0.6
FACE_DETECTION_MODEL=hog

# Service Configuration
HOST=0.0.0.0
PORT=8000
"""
    
    with open("python_service/.env", "w") as f:
        f.write(python_env_content)
    print("✅ Created python_service/.env")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Set up PostgreSQL database with the credentials in server/.env")
    print("2. Run: python server/server.js (Backend API)")
    print("3. Run: python python_service/face_recognition_service.py (Face Recognition)")
    print("4. Run: cd client && npm run dev (Frontend)")
    print("5. Run: cd client && npm run electron (Desktop App)")
    
    print("\n🔧 Database Setup:")
    print("Create a PostgreSQL database named 'face_rec' with user 'exan' and password 'exan'")
    print("The system will automatically create the required tables on first run.")
    
    print("\n📱 DroidCam Setup:")
    print("1. Install DroidCam on your phone")
    print("2. Connect your phone to the same network")
    print("3. Update DROIDCAM_IP in server/.env with your phone's IP")
    print("4. The system will use DroidCam as the camera source")

if __name__ == "__main__":
    main()
