import os
import io
import base64
import json
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Simple Face Recognition Service", version="1.0.0")

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

def simulate_face_recognition(image):
    """Simulate face recognition for testing"""
    # For now, just return a simulated result
    import random
    
    # Simulate some recognition logic
    if random.random() > 0.3:  # 70% success rate for demo
        # Return a random employee
        if face_database:
            employee_id = random.choice(list(face_database.keys()))
            confidence = random.uniform(0.7, 0.95)
            return employee_id, confidence
        else:
            return None, 0.0
    else:
        # Failed recognition
        return None, random.uniform(0.1, 0.5)

@app.on_event("startup")
async def startup_event():
    """Load face database on startup"""
    print("Starting Simple Face Recognition Service...")
    load_face_database()

@app.get("/")
async def root():
    return {
        "message": "Simple Face Recognition Service",
        "status": "running",
        "loaded_faces": len(known_face_encodings),
        "note": "This is a simplified version for testing without dlib/face-recognition"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_faces": len(known_face_encodings),
        "confidence_threshold": 0.6,
        "note": "Simplified service - face recognition is simulated"
    }

@app.post("/recognize")
async def recognize_face_endpoint(file: UploadFile = File(...)):
    """Recognize face in uploaded image (simulated)"""
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Simulate face recognition
        employee_id, confidence = simulate_face_recognition(image)
        
        if employee_id:
            employee_info = face_database.get(employee_id, {})
            return {
                "recognized": True,
                "employeeId": employee_id,
                "confidence": float(confidence),
                "employee": employee_info,
                "message": f"Welcome, {employee_info.get('name', 'Unknown')}!",
                "note": "This is a simulated recognition result"
            }
        else:
            return {
                "recognized": False,
                "confidence": float(confidence),
                "message": "Face not recognized",
                "note": "This is a simulated recognition result"
            }
            
    except Exception as e:
        print(f"Error in face recognition: {e}")
        raise HTTPException(status_code=500, detail=f"Face recognition failed: {str(e)}")

@app.post("/encode")
async def encode_face_endpoint(file: UploadFile = File(...)):
    """Encode face in uploaded image for database storage (simulated)"""
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Simulate face encoding
        fake_encoding = np.random.random(128).astype(np.float64)
        face_encoding_b64 = base64.b64encode(fake_encoding.tobytes()).decode('utf-8')
        
        return {
            "success": True,
            "face_encoding": face_encoding_b64,
            "message": "Face encoding generated successfully (simulated)",
            "note": "This is a simulated encoding result"
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
