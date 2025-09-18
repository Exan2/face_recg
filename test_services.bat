@echo off
echo Testing Face Recognition System Services...
echo.

echo Starting Backend API Server...
start "Backend API" cmd /k "cd server && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Python Face Recognition Service...
start "Face Recognition" cmd /k "cd python_service && python simple_face_service.py"

timeout /t 5 /nobreak >nul

echo Starting Frontend Development Server...
start "Frontend" cmd /k "cd client && npm run dev"

timeout /t 8 /nobreak >nul

echo Testing services...
echo.

echo Testing Backend API...
curl http://localhost:5000/api/health
echo.

echo Testing Python Service...
curl http://localhost:8000/health
echo.

echo Testing Frontend...
curl http://localhost:3000
echo.

echo.
echo All services should be running now!
echo.
echo Open your browser and go to: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
