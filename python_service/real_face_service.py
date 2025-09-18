import os
import io
import base64
import json
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import requests
from dotenv import load_dotenv
import pickle
import tempfile
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

load_dotenv()

app = FastAPI(title="DeepFace Recognition Service", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store face data
known_face_encodings = []
known_face_ids = []
face_database = {}

# Configuration
CONFIDENCE_THRESHOLD = 0.15  # Much lower threshold for better recognition
MODEL_NAME = "OpenFace"  # Lightest model
DETECTOR_BACKEND = "opencv"  # Fastest detector

# Initialize DeepFace lazily
deepface_initialized = False

def initialize_deepface():
    """Initialize DeepFace lazily"""
    global deepface_initialized
    if deepface_initialized:
        return True
    
    try:
        print("🔧 Initializing DeepFace...")
        from deepface import DeepFace
        
        # Test with a simple image to initialize
        test_img = np.zeros((224, 224, 3), dtype=np.uint8)
        
        # Initialize with minimal settings
        DeepFace.represent(
            img_path=test_img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False
        )
        
        deepface_initialized = True
        print("✅ DeepFace initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ DeepFace initialization failed: {e}")
        return False

def extract_face_embedding(image_path):
    """Extract face embedding using DeepFace"""
    try:
        if not initialize_deepface():
            return None, False
            
        from deepface import DeepFace
        
        print(f"🔍 Extracting face embedding...")
        
        # Use DeepFace to extract face embedding
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True
        )
        
        if embedding and len(embedding) > 0:
            face_embedding = embedding[0]["embedding"]
            print(f"✅ Face embedding extracted, length: {len(face_embedding)}")
            return np.array(face_embedding), True
        else:
            print("❌ No face embedding extracted")
            return None, False
            
    except Exception as e:
        print(f"❌ Error extracting face embedding: {e}")
        return None, False

def compare_faces(embedding1, embedding2):
    """Compare two face embeddings using cosine similarity"""
    try:
        if embedding1 is None or embedding2 is None:
            return 0.0
        
        # Ensure both embeddings have the same length
        min_len = min(len(embedding1), len(embedding2))
        embedding1 = embedding1[:min_len]
        embedding2 = embedding2[:min_len]
        
        # Calculate cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        similarity = dot_product / (norm1 * norm2)
        
        # Debug logging
        print(f"🔍 Face comparison: similarity={similarity:.4f}, norm1={norm1:.4f}, norm2={norm2:.4f}")
        
        return float(similarity)
        
    except Exception as e:
        print(f"❌ Error comparing faces: {e}")
        return 0.0

def load_face_database():
    """Load face embeddings from the database"""
    global known_face_encodings, known_face_ids, face_database
    
    try:
        print("🔄 Loading face database...")
        
        # Get employees from the backend API
        response = requests.get(f"{os.getenv('BACKEND_URL', 'http://localhost:5000')}/api/employees")
        if response.status_code == 200:
            employees = response.json()
            
            known_face_encodings = []
            known_face_ids = []
            face_database = {}
            
            for employee in employees:
                if employee.get('faceEncoding'):
                    try:
                        # Decode face encoding from base64
                        face_encoding = pickle.loads(base64.b64decode(employee['faceEncoding']))
                        known_face_encodings.append(face_encoding)
                        known_face_ids.append(employee['id'])
                        face_database[employee['id']] = {
                            'name': employee['name'],
                            'employeeId': employee['employeeId'],
                            'specialty': employee['specialty'],
                            'city': employee['city'],
                            'birthDate': employee['birthDate']
                        }
                        print(f"✅ Loaded face for: {employee['name']}")
                    except Exception as e:
                        print(f"❌ Error loading face encoding for employee {employee['id']}: {e}")
            
            print(f"✅ Loaded {len(known_face_encodings)} face embeddings from database")
        else:
            print("❌ Failed to load employees from database")
            
    except Exception as e:
        print(f"❌ Error loading face database: {e}")

def recognize_face(face_embedding):
    """Recognize a face embedding against known faces"""
    if not known_face_encodings or face_embedding is None:
        return None, 0.0
    
    try:
        best_match_id = None
        best_similarity = 0.0
        
        for i, known_embedding in enumerate(known_face_encodings):
            similarity = compare_faces(face_embedding, known_embedding)
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_id = known_face_ids[i]
        
        print(f"🔍 Best similarity: {best_similarity:.4f}, threshold: {CONFIDENCE_THRESHOLD}")
        
        if best_similarity >= CONFIDENCE_THRESHOLD:
            return best_match_id, best_similarity
        
        return None, best_similarity
        
    except Exception as e:
        print(f"❌ Error recognizing face: {e}")
        return None, 0.0

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting DeepFace Recognition Service...")
    print(f"🔧 Using model: {MODEL_NAME}")
    print(f"🔧 Using detector: {DETECTOR_BACKEND}")
    
    load_face_database()
    print("✅ DeepFace Recognition Service ready!")

@app.get("/")
async def root():
    return {
        "message": "DeepFace Recognition Service",
        "status": "running",
        "loaded_faces": len(known_face_encodings),
        "model": MODEL_NAME,
        "detector": DETECTOR_BACKEND,
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_faces": len(known_face_encodings),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "model": MODEL_NAME,
        "detector": DETECTOR_BACKEND
    }

@app.post("/recognize")
async def recognize_face_endpoint(file: UploadFile = File(...)):
    """Recognize face in uploaded image using DeepFace"""
    try:
        print(f"🔍 Recognition request received for file: {file.filename}")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            contents = await file.read()
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract face embedding using DeepFace
            print("🔍 Extracting face embedding with DeepFace...")
            face_embedding, face_detected = extract_face_embedding(tmp_file_path)
            
            if not face_detected or face_embedding is None:
                return {
                    "recognized": False,
                    "message": "No faces detected in the image",
                    "confidence": 0.0
                }
            
            # Recognize the face
            print("🔍 Comparing against known faces...")
            employee_id, confidence = recognize_face(face_embedding)
            
            if employee_id:
                employee_info = face_database.get(employee_id, {})
                return {
                    "recognized": True,
                    "employeeId": int(employee_id),
                    "confidence": float(confidence),
                    "employee": employee_info,
                    "message": f"Welcome, {employee_info.get('name', 'Unknown')}!",
                    "model_used": MODEL_NAME
                }
            else:
                return {
                    "recognized": False,
                    "confidence": float(confidence),
                    "message": "Face not recognized",
                    "model_used": MODEL_NAME
                }
                
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except:
                pass
                
    except Exception as e:
        print(f"❌ Error in face recognition: {e}")
        raise HTTPException(status_code=500, detail=f"Face recognition failed: {str(e)}")

@app.post("/encode")
async def encode_face_endpoint(file: UploadFile = File(...)):
    """Encode face in uploaded image for database storage using DeepFace"""
    try:
        print(f"🔍 Encoding request received for file: {file.filename}")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            contents = await file.read()
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract face embedding using DeepFace
            print("🔍 Extracting face embedding with DeepFace...")
            face_embedding, face_detected = extract_face_embedding(tmp_file_path)
            
            if not face_detected or face_embedding is None:
                return {
                    "success": False,
                    "face_encoding": None,
                    "message": "No faces detected in the image",
                    "model_used": MODEL_NAME
                }
            
            print(f"✅ Face embedding extracted successfully, length: {len(face_embedding)}")
            
            # Convert to base64 for storage
            face_encoding_b64 = base64.b64encode(pickle.dumps(face_embedding)).decode('utf-8')
            print(f"💾 Face encoding length: {len(face_encoding_b64)} characters")
            
            return {
                "success": True,
                "face_encoding": face_encoding_b64,
                "message": "Face encoding generated successfully using DeepFace",
                "model_used": MODEL_NAME,
                "embedding_length": len(face_embedding)
            }
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except:
                pass
                
    except Exception as e:
        print(f"❌ Error encoding face: {e}")
        raise HTTPException(status_code=500, detail=f"Face encoding failed: {str(e)}")

@app.post("/reload")
async def reload_database():
    """Reload face database from backend"""
    try:
        load_face_database()
        return {
            "success": True,
            "message": f"Database reloaded. {len(known_face_encodings)} faces loaded.",
            "loaded_faces": len(known_face_encodings),
            "model": MODEL_NAME
        }
    except Exception as e:
        print(f"❌ Error reloading database: {e}")
        raise HTTPException(status_code=500, detail=f"Database reload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)