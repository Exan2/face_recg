import os
from dotenv import load_dotenv

load_dotenv()

# Backend API URL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

# Face Recognition Configuration
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.6'))
FACE_DETECTION_MODEL = os.getenv('FACE_DETECTION_MODEL', 'hog')  # 'hog' for CPU, 'cnn' for GPU

# Service Configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8000'))
