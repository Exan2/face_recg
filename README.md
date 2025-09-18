# Face Recognition Employee System

A comprehensive face recognition system for employee access control using DroidCam, built with Next.js, Node.js, Python, and Electron.

## 🎯 Features

- **Real-time Face Recognition**: Using Python FaceNet library optimized for your hardware
- **Employee Management**: Complete CRUD operations for employee database
- **Live Camera Feed**: DroidCam integration for mobile camera support
- **Desktop Application**: Electron wrapper for native desktop experience
- **Admin Dashboard**: Real-time monitoring and management interface
- **Security Alerts**: Automatic logging and notifications for unauthorized access
- **Database Integration**: PostgreSQL with Sequelize ORM
- **Cross-platform**: Windows, macOS, and Linux support

## 🖥️ System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 16GB (as specified)
- **CPU**: Intel i5-8600 or equivalent
- **GPU**: GTX 1060 3GB (optional, for GPU acceleration)
- **Node.js**: v18 or higher
- **Python**: 3.8 or higher
- **PostgreSQL**: 12 or higher

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd face_rec
python setup.py
```

### 2. Database Setup

Create a PostgreSQL database (use your own secure credentials):
```sql
CREATE DATABASE face_rec;
CREATE USER your_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE face_rec TO your_user;
```

### 3. Start Services

**Terminal 1 - Backend API:**
```bash
cd server
npm run dev
```

**Terminal 2 - Face Recognition Service:**
```bash
cd python_service
python face_recognition_service.py
```

**Terminal 3 - Frontend (Web):**
```bash
cd client
npm run dev
```

**Terminal 4 - Desktop App:**
```bash
cd client
npm run electron-dev
```

## 📱 DroidCam Setup

1. **Install DroidCam** on your Android/iOS device
2. **Connect to same network** as your computer
3. **Find your phone's IP** (usually 192.168.1.xxx)
4. **Update configuration** in `server/.env`:
   ```
   DROIDCAM_IP=192.168.1.100
   DROIDCAM_PORT=4747
   ```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron App  │    │   Web Browser   │    │   Mobile App    │
│   (Desktop)     │    │   (Frontend)    │    │   (DroidCam)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Next.js Frontend     │
                    │    (React Components)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Node.js Backend      │
                    │   (Express + Sequelize)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Python Face Recognition │
                    │   (FaceNet + OpenCV)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     PostgreSQL Database   │
                    │   (Employee + Scan Data)  │
                    └───────────────────────────┘
```

## 📊 Database Schema

### Employees Table
- `id` - Primary key
- `employee_id` - Unique employee identifier
- `name` - Full name
- `specialty` - Job specialty
- `city` - City location
- `birth_date` - Date of birth
- `face_encoding` - Base64 encoded face data
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Scan History Table
- `id` - Primary key
- `employee_id` - Foreign key to employees
- `scan_type` - 'success', 'failed', or 'unknown'
- `confidence` - Recognition confidence score
- `image_path` - Path to captured image
- `ip_address` - Client IP address
- `user_agent` - Browser information
- `location` - Optional location data
- `notes` - Additional notes
- `scanned_at` - Scan timestamp

## 🔧 Configuration

### Backend Configuration (`server/.env`)
```env
DB_NAME=face_rec
DB_USER=your_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=5432
PORT=5000
JWT_SECRET=change_me_secret
PYTHON_SERVICE_URL=http://localhost:8000
DROIDCAM_IP=192.168.1.100
DROIDCAM_PORT=4747
```

### Python Service Configuration (`python_service/.env`)
```env
BACKEND_URL=http://localhost:5000
CONFIDENCE_THRESHOLD=0.6
FACE_DETECTION_MODEL=hog
HOST=0.0.0.0
PORT=8000
```

## 🎮 Usage

### Admin Dashboard
1. **Add Employees**: Upload photos and enter employee details
2. **Monitor Scans**: View real-time scan history and statistics
3. **Security Alerts**: Get notified of failed access attempts
4. **Manage Access**: Activate/deactivate employee accounts

### User Interface
1. **Position Face**: Stand in front of the camera
2. **Initiate Scan**: Click "INITIATE SCAN" button
3. **Wait for Recognition**: System processes your face
4. **View Result**: See access granted/denied with details

## 🔒 Security Features

- **Face Encoding**: Secure biometric data storage
- **Access Logging**: Complete audit trail
- **Real-time Alerts**: Immediate security notifications
- **IP Tracking**: Monitor access locations
- **Confidence Scoring**: Adjustable recognition thresholds

## 🛠️ Development

### API Endpoints

**Employees:**
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Deactivate employee

**Face Recognition:**
- `POST /api/scan/recognize` - Perform face recognition
- `GET /api/scan/history` - Get scan history
- `GET /api/scan/stats` - Get scan statistics

### Python Service Endpoints

- `POST /recognize` - Recognize face in image
- `POST /encode` - Encode face for database storage
- `POST /reload` - Reload face database
- `GET /health` - Service health check

## 📦 Building for Production

### Desktop App
```bash
cd client
npm run build-electron
npm run dist
```

### Web App
```bash
cd client
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**: Check browser permissions and DroidCam connection
2. **Face recognition fails**: Ensure Python service is running and database is connected
3. **Database errors**: Verify PostgreSQL is running and credentials are correct
4. **Electron app won't start**: Make sure Next.js dev server is running first

### Performance Optimization

- **GPU Acceleration**: Set `FACE_DETECTION_MODEL=cnn` in Python service for GPU usage
- **Memory Management**: Adjust confidence threshold based on your hardware
- **Database Indexing**: Add indexes on frequently queried columns

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---


# face_recg
