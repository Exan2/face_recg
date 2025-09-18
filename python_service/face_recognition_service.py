import os
import io
import base64
import json
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
from PIL import Image
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Face Recognition Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store face encodings
known_face_encodings = []
known_face_ids = []
face_database = {}

# Configuration
CONFIDENCE_THRESHOLD = 0.6
FACE_DETECTION_MODEL = "hog"  # Use "hog" for CPU, "cnn" for GPU (requires more memory)

def load_face_database():
    """Load face encodings from the database"""
    global known_face_encodings, known_face_ids, face_database
    
    try:
        # Get employees from the backend API
        response = requests.get(f"{os.getenv('BACKEND_URL', 'http://localhost:5000')}/api/employees")
        if response.status_code == 200:
            employees = response.json()
            
            for employee in employees:
                if employee.get('faceEncoding'):
                    try:
                        # Decode face encoding from base64
                        face_encoding = np.frombuffer(
                            base64.b64decode(employee['faceEncoding']), 
                            dtype=np.float64
                        )
                        known_face_encodings.append(face_encoding)
                        known_face_ids.append(employee['id'])
                        face_database[employee['id']] = {
                            'name': employee['name'],
                            'employeeId': employee['employeeId'],
                            'specialty': employee['specialty'],
                            'city': employee['city'],
                            'birthDate': employee['birthDate']
                        }
                    except Exception as e:
                        print(f"Error loading face encoding for employee {employee['id']}: {e}")
            
            print(f"Loaded {len(known_face_encodings)} face encodings from database")
        else:
            print("Failed to load employees from database")
            
    except Exception as e:
        print(f"Error loading face database: {e}")

def detect_and_encode_faces(image):
    """Detect faces in image and return encodings"""
    try:
        # Convert PIL to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL to numpy array
        img_array = np.array(image)
        
        # Find face locations
        face_locations = face_recognition.face_locations(
            img_array, 
            model=FACE_DETECTION_MODEL
        )
        
        if not face_locations:
            return [], []
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        return face_encodings, face_locations
        
    except Exception as e:
        print(f"Error detecting faces: {e}")
        return [], []

def recognize_face(face_encoding):
    """Recognize a face encoding against known faces"""
    if not known_face_encodings:
        return None, 0.0
    
    try:
        # Compare face encoding with known faces
        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
        
        # Find the best match
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]
        
        # Convert distance to confidence (lower distance = higher confidence)
        confidence = max(0, 1 - best_distance)
        
        if confidence >= CONFIDENCE_THRESHOLD:
            employee_id = known_face_ids[best_match_index]
            return employee_id, confidence
        
        return None, confidence
        
    except Exception as e:
        print(f"Error recognizing face: {e}")
        return None, 0.0

@app.on_event("startup")
async def startup_event():
    """Load face database on startup"""
    print("Starting Face Recognition Service...")
    load_face_database()

@app.get("/")
async def root():
    return {
        "message": "Face Recognition Service",
        "status": "running",
        "loaded_faces": len(known_face_encodings)
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_faces": len(known_face_encodings),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }

@app.post("/recognize")
async def recognize_face_endpoint(file: UploadFile = File(...)):
    """Recognize face in uploaded image"""
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Detect faces and get encodings
        face_encodings, face_locations = detect_and_encode_faces(image)
        
        if not face_encodings:
            return {
                "recognized": False,
                "message": "No faces detected in the image",
                "confidence": 0.0
            }
        
        # Use the first detected face
        face_encoding = face_encodings[0]
        
        # Recognize the face
        employee_id, confidence = recognize_face(face_encoding)
        
        if employee_id:
            employee_info = face_database.get(employee_id, {})
            return {
                "recognized": True,
                "employeeId": employee_id,
                "confidence": float(confidence),
                "employee": employee_info,
                "message": f"Welcome, {employee_info.get('name', 'Unknown')}!"
            }
        else:
            return {
                "recognized": False,
                "confidence": float(confidence),
                "message": "Face not recognized"
            }
            
    except Exception as e:
        print(f"Error in face recognition: {e}")
        raise HTTPException(status_code=500, detail=f"Face recognition failed: {str(e)}")

@app.post("/encode")
async def encode_face_endpoint(file: UploadFile = File(...)):
    """Encode face in uploaded image for database storage"""
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Detect faces and get encodings
        face_encodings, face_locations = detect_and_encode_faces(image)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="No faces detected in the image")
        
        # Use the first detected face
        face_encoding = face_encodings[0]
        
        # Convert to base64 for storage
        face_encoding_b64 = base64.b64encode(face_encoding.tobytes()).decode('utf-8')
        
        return {
            "success": True,
            "face_encoding": face_encoding_b64,
            "message": "Face encoding generated successfully"
        }
        
    except Exception as e:
        print(f"Error encoding face: {e}")
        raise HTTPException(status_code=500, detail=f"Face encoding failed: {str(e)}")

@app.post("/reload")
async def reload_database():
    """Reload face database from backend"""
    try:
        load_face_database()
        return {
            "success": True,
            "message": f"Database reloaded. {len(known_face_encodings)} faces loaded.",
            "loaded_faces": len(known_face_encodings)
        }
    except Exception as e:
        print(f"Error reloading database: {e}")
        raise HTTPException(status_code=500, detail=f"Database reload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
