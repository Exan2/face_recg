@echo off
echo Starting Real Face Recognition System...
echo.

echo Starting Backend API Server...
start "Backend API" cmd /k "cd server && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Real Face Recognition Service...
start "Real Face Recognition" cmd /k "cd python_service && C:\Users\compt\AppData\Local\Programs\Python\Python313\python.exe real_face_service.py"

timeout /t 5 /nobreak >nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd client && npm run dev"

timeout /t 8 /nobreak >nul

echo Testing services...
echo.

echo Testing Backend API...
curl http://localhost:5000/api/health
echo.

echo Testing Real Face Recognition Service...
curl http://localhost:8000/health
echo.

echo Testing Frontend...
curl http://localhost:3000
echo.

echo.
echo 🎉 Real Face Recognition System is ready!
echo.
echo 📋 How to test real face recognition:
echo.
echo 1. Open your browser: http://localhost:3000
echo 2. Go to Admin Dashboard
echo 3. Click "Add Employee"
echo 4. Upload a clear photo of your face
echo 5. Fill in your details and save
echo 6. Switch to "User Access" mode
echo 7. Click "INITIATE SCAN" and show your face to the camera
echo 8. The system will recognize you with real face detection!
echo.
echo 🔧 Features:
echo - Real face detection using OpenCV
echo - Face feature extraction and comparison
echo - Confidence scoring
echo - Face location detection
echo - Works with webcam or uploaded photos
echo.
echo Press any key to exit...
pause >nul
