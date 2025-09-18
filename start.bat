@echo off
echo Starting Face Recognition Employee System...
echo.

echo Starting Backend API Server...
start "Backend API" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Python Face Recognition Service...
start "Face Recognition" cmd /k "cd python_service && python face_recognition_service.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd client && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Electron Desktop App...
start "Desktop App" cmd /k "cd client && npm run electron"

echo.
echo All services started!
echo.
echo Services running on:
echo - Backend API: http://localhost:5000
echo - Face Recognition: http://localhost:8000
echo - Frontend: http://localhost:3000
echo - Desktop App: Electron window
echo.
echo Press any key to exit...
pause >nul
