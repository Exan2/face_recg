const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Employee, ScanHistory } = require('../models');
const router = express.Router();

// Configure multer for scan image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/scans');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `scan-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/scan/recognize - Face recognition scan
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Scan request received');
    console.log('📁 File:', req.file);
    console.log('🌐 Client IP:', req.ip);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = req.file.path;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    console.log('📸 Image path:', imagePath);

    // Call Python face recognition service
    console.log('🐍 Calling Python service...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const pythonResponse = await axios.post(
      `${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}/recognize`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('🐍 Python service response:', pythonResponse.data);

    const { recognized, employeeId, confidence, faceEncoding } = pythonResponse.data;

    let scanResult;
    let employee = null;

    if (recognized && employeeId) {
      // Find the recognized employee
      employee = await Employee.findByPk(employeeId);
      
      if (employee) {
        scanResult = await ScanHistory.create({
          employeeId: employee.id,
          scanType: 'success',
          confidence,
          imagePath,
          ipAddress: clientIP,
          userAgent,
          location: req.body.location || null
        });
      }
    } else {
      // Failed recognition
      scanResult = await ScanHistory.create({
        scanType: 'failed',
        confidence: confidence || 0,
        imagePath,
        ipAddress: clientIP,
        userAgent,
        location: req.body.location || null,
        notes: 'Face not recognized'
      });
    }

    // Emit real-time notification to admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('scanResult', {
        type: recognized ? 'success' : 'failed',
        employee: employee,
        confidence,
        timestamp: new Date(),
        ipAddress: clientIP
      });
    }

    res.json({
      recognized,
      employee,
      confidence,
      scanId: scanResult.id,
      message: recognized 
        ? `Welcome, ${employee.name}!` 
        : 'You are not an employee here. Access denied.'
    });

  } catch (error) {
    console.error('Face recognition error:', error);
    
    // Log failed scan
    await ScanHistory.create({
      scanType: 'failed',
      imagePath: req.file?.path,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      notes: `Recognition error: ${error.message}`
    });

    res.status(500).json({ 
      error: 'Face recognition failed',
      message: 'Unable to process face recognition at this time.'
    });
  }
});

// GET /api/scan/history - Get scan history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (type && ['success', 'failed', 'unknown'].includes(type)) {
      whereClause.scanType = type;
    }

    const { count, rows } = await ScanHistory.findAndCountAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        required: false
      }],
      order: [['scannedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      scans: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

// GET /api/scan/stats - Get scan statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalScans, todayScans, successScans, failedScans] = await Promise.all([
      ScanHistory.count(),
      ScanHistory.count({
        where: {
          scannedAt: {
            [require('sequelize').Op.gte]: today
          }
        }
      }),
      ScanHistory.count({ where: { scanType: 'success' } }),
      ScanHistory.count({ where: { scanType: 'failed' } })
    ]);

    res.json({
      totalScans,
      todayScans,
      successScans,
      failedScans,
      successRate: totalScans > 0 ? ((successScans / totalScans) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching scan stats:', error);
    res.status(500).json({ error: 'Failed to fetch scan statistics' });
  }
});

// DELETE /api/scan/history - Clear old scan history
router.delete('/history', async (req, res) => {
  try {
    const { olderThan, allFailed } = req.query;
    
    let whereClause = {};
    
    if (allFailed === 'true') {
      // Clear ALL failed scans regardless of age
      whereClause = {
        scanType: 'failed'
      };
    } else if (olderThan) {
      // Clear scans older than specified hours
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - parseInt(olderThan));
      whereClause.scannedAt = {
        [require('sequelize').Op.lt]: cutoffDate
      };
    } else {
      // Clear all failed scans older than 24 hours by default
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      whereClause = {
        scanType: 'failed',
        scannedAt: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      };
    }

    const deletedCount = await ScanHistory.destroy({
      where: whereClause
    });

    console.log(`Cleared ${deletedCount} old scan records`);

    res.json({
      success: true,
      deletedCount,
      message: `Successfully cleared ${deletedCount} old scan records`
    });
  } catch (error) {
    console.error('Error clearing scan history:', error);
    res.status(500).json({ error: 'Failed to clear scan history' });
  }
});

module.exports = router;
