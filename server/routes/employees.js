const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Employee, ScanHistory } = require('../models');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/employees');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `employee-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees - Create new employee
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { employeeId, name, specialty, city, birthDate } = req.body;
    
    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ 
      where: { employeeId } 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    let faceEncoding = null;
    
    // Generate face encoding if photo is provided
    if (req.file) {
      try {
        console.log('Generating face encoding for employee:', name);
        
        // Call Python face recognition service to encode the face
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        
        console.log('Sending request to Python service for encoding...');
        const pythonResponse = await axios.post(
          `${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}/encode`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000 // 30 seconds timeout
          }
        );
        
        console.log('Python service response:', pythonResponse.data);
        
        if (pythonResponse.data.success && pythonResponse.data.face_encoding) {
          faceEncoding = pythonResponse.data.face_encoding;
          console.log('Face encoding generated successfully for:', name, 'Length:', faceEncoding.length);
        } else {
          console.log('No face detected in image for:', name, 'Response:', pythonResponse.data);
        }
      } catch (encodingError) {
        console.error('Error generating face encoding for', name, ':', encodingError.message);
        if (encodingError.response) {
          console.error('Python service error response:', encodingError.response.data);
        }
        // Continue without face encoding - employee can still be created
      }
    }

    console.log('Creating employee with face encoding:', faceEncoding ? 'Present' : 'Null');
    
    const employee = await Employee.create({
      employeeId,
      name,
      specialty,
      city,
      birthDate,
      imagePath: req.file ? `employees/${req.file.filename}` : null,
      faceEncoding: faceEncoding
    });

    console.log('Employee created successfully:', employee.name, 'Face encoding stored:', employee.faceEncoding ? 'Yes' : 'No');
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { name, specialty, city, birthDate } = req.body;
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let faceEncoding = employee.faceEncoding; // Keep existing encoding
    
    // Generate new face encoding if new photo is provided
    if (req.file) {
      try {
        console.log('Updating face encoding for employee:', name);
        
        // Call Python face recognition service to encode the face
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        
        const pythonResponse = await axios.post(
          `${process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'}/encode`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000 // 30 seconds timeout
          }
        );
        
        if (pythonResponse.data.success && pythonResponse.data.face_encoding) {
          faceEncoding = pythonResponse.data.face_encoding;
          console.log('Face encoding updated successfully for:', name);
        } else {
          console.log('No face detected in new image for:', name);
        }
      } catch (encodingError) {
        console.error('Error updating face encoding:', encodingError.message);
        // Continue without updating face encoding
      }
    }

    // Update employee data
    await employee.update({
      name,
      specialty,
      city,
      birthDate,
      ...(req.file && { imagePath: `employees/${req.file.filename}` }),
      faceEncoding: faceEncoding
    });

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id - Hard delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete the employee image file if it exists
    if (employee.imagePath && fs.existsSync(employee.imagePath)) {
      try {
        fs.unlinkSync(employee.imagePath);
        console.log('Deleted employee image:', employee.imagePath);
      } catch (fileError) {
        console.error('Error deleting employee image:', fileError);
      }
    }

    // Permanently delete the employee from database
    await employee.destroy();
    
    console.log('Employee permanently deleted:', employee.name, employee.employeeId);
    res.json({ message: 'Employee permanently deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// POST /api/employees/:id/face-encoding - Update face encoding
router.post('/:id/face-encoding', async (req, res) => {
  try {
    const { faceEncoding } = req.body;
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.update({ faceEncoding });
    res.json({ message: 'Face encoding updated successfully' });
  } catch (error) {
    console.error('Error updating face encoding:', error);
    res.status(500).json({ error: 'Failed to update face encoding' });
  }
});

module.exports = router;
