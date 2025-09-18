#!/bin/bash

echo "Starting Face Recognition Employee System..."
echo

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local directory=$3
    
    echo "Starting $name..."
    cd "$directory"
    $command &
    cd ..
    sleep 2
}

# Start all services
start_service "Backend API" "npm run dev" "server"
start_service "Python Face Recognition Service" "python face_recognition_service.py" "python_service"
start_service "Frontend Development Server" "npm run dev" "client"

# Wait a bit for services to start
sleep 5

# Start Electron app
echo "Starting Electron Desktop App..."
cd client
npm run electron &
cd ..

echo
echo "All services started!"
echo
echo "Services running on:"
echo "- Backend API: http://localhost:5000"
echo "- Face Recognition: http://localhost:8000"
echo "- Frontend: http://localhost:3000"
echo "- Desktop App: Electron window"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping all services..."; kill $(jobs -p); exit' INT
wait
