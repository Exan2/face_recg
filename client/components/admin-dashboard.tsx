"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Shield, User, Settings, Plus, Edit, Trash2, Upload, AlertTriangle, History, BarChart3, Camera, X } from "lucide-react"

interface Employee {
  id: number
  employeeId: string
  name: string
  specialty: string
  city: string
  birthDate: string
  imagePath?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ScanHistory {
  id: number
  employeeId?: number
  scanType: 'success' | 'failed' | 'unknown'
  confidence?: number
  imagePath?: string
  ipAddress?: string
  userAgent?: string
  location?: string
  notes?: string
  scannedAt: string
  employee?: Employee
}

interface ScanStats {
  totalScans: number
  todayScans: number
  successScans: number
  failedScans: number
  successRate: string
}

export function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [scanStats, setScanStats] = useState<ScanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [newEmployee, setNewEmployee] = useState({ 
    employeeId: "", 
    name: "", 
    specialty: "", 
    city: "", 
    birthDate: "",
    photo: null as File | null
  })
  const [activeTab, setActiveTab] = useState<"dashboard" | "add" | "history" | "settings">("dashboard")
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'

  // Load data on component mount
  useEffect(() => {
    loadEmployees()
    loadScanHistory()
    loadScanStats()
  }, [])


  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/employees`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadScanHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scan/history?limit=20`)
      if (response.ok) {
        const data = await response.json()
        setScanHistory(data.scans)
      }
    } catch (error) {
      console.error('Error loading scan history:', error)
    }
  }

  const loadScanStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scan/stats`)
      if (response.ok) {
        const data = await response.json()
        setScanStats(data)
      }
    } catch (error) {
      console.error('Error loading scan stats:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleAddEmployee = async () => {
    if (!newEmployee.employeeId || !newEmployee.name || !newEmployee.specialty || !newEmployee.city || !newEmployee.birthDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const formData = new FormData()
      formData.append('employeeId', newEmployee.employeeId)
      formData.append('name', newEmployee.name)
      formData.append('specialty', newEmployee.specialty)
      formData.append('city', newEmployee.city)
      formData.append('birthDate', newEmployee.birthDate)
      if (newEmployee.photo) {
        formData.append('photo', newEmployee.photo)
      }

      const response = await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const employee = await response.json()
        setEmployees([...employees, employee])
        setNewEmployee({ 
          employeeId: "", 
          name: "", 
          specialty: "", 
          city: "", 
          birthDate: "",
          photo: null
        })
        setActiveTab("dashboard")
        alert('Employee added successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      alert('Failed to add employee')
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    const employee = employees.find(emp => emp.id === id)
    const employeeName = employee ? employee.name : 'this employee'
    
    if (confirm(`Are you sure you want to PERMANENTLY DELETE ${employeeName}?\n\nThis action cannot be undone and will:\n- Remove the employee from the database\n- Delete their photo file\n- Remove their face encoding\n\nType "DELETE" to confirm:`)) {
      const confirmation = prompt('Type "DELETE" to confirm permanent deletion:')
      if (confirmation === 'DELETE') {
        try {
          const response = await fetch(`${API_BASE}/api/employees/${id}`, {
            method: 'DELETE'
          })
          if (response.ok) {
            setEmployees(employees.filter((emp) => emp.id !== id))
            alert('Employee permanently deleted successfully')
          } else {
            const error = await response.json()
            alert(`Error: ${error.error}`)
          }
        } catch (error) {
          console.error('Error deleting employee:', error)
          alert('Failed to delete employee')
        }
      } else {
        alert('Deletion cancelled - confirmation text did not match')
      }
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setNewEmployee({ ...newEmployee, photo: file })
    }
  }

  const getAvailableCameras = async () => {
    try {
      // First request camera permission to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true })
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      
      console.log('Available cameras:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })))
      
      // Auto-select DroidCam if available
      const droidCam = videoDevices.find(device => 
        device.label.toLowerCase().includes('droidcam') || 
        device.label.toLowerCase().includes('droid') ||
        device.label.toLowerCase().includes('android')
      )
      
      if (droidCam) {
        setSelectedCameraId(droidCam.deviceId)
        console.log('DroidCam found:', droidCam.label)
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId)
        console.log('Using default camera:', videoDevices[0].label)
      }
    } catch (error) {
      console.error('Error getting camera devices:', error)
    }
  }

  const initializeCamera = async () => {
    try {
      // First get available cameras
      await getAvailableCameras()
      
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined
        }
      }
      
      console.log('Requesting camera with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera stream obtained:', stream)
      
      setCameraStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          videoRef.current?.play().catch(console.error)
        }
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e)
        }
      }
      
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      const message = error instanceof Error ? error.message : String(error)
      alert(`Camera access failed: ${message}. Please check if DroidCam is connected and try again.`)
    }
  }

  const switchCamera = async (cameraId: string) => {
    try {
      // Stop current stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
      
      setSelectedCameraId(cameraId)
      
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          deviceId: { exact: cameraId }
        }
      }
      
      console.log('Switching to camera:', cameraId, constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('New camera stream obtained:', stream)
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded for new camera')
          videoRef.current?.play().catch(console.error)
        }
      }
    } catch (error) {
      console.error('Error switching camera:', error)
      const message = error instanceof Error ? error.message : String(error)
      alert(`Failed to switch camera: ${message}. Please try again.`)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
        // Convert canvas to blob and create File object
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' })
            setNewEmployee({ ...newEmployee, photo: file })
            
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-black/50 backdrop-blur-md border-r border-cyan-500/30 p-4">
        <div className="flex items-center gap-3 mb-8 p-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Control</h1>
            <p className="text-cyan-400 text-sm">Security Center</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
              activeTab === "dashboard"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-gray-300 hover:text-cyan-100 hover:bg-cyan-500/10"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
              activeTab === "add"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-gray-300 hover:text-cyan-100 hover:bg-cyan-500/10"
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
              activeTab === "history"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-gray-300 hover:text-cyan-100 hover:bg-cyan-500/10"
            }`}
          >
            <History className="w-5 h-5" />
            Scan History
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
              activeTab === "settings"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-gray-300 hover:text-cyan-100 hover:bg-cyan-500/10"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Control Center</h1>
                <p className="text-cyan-400">Employee Access Management System</p>
              </div>
            </div>

            {/* Statistics Cards */}
            {scanStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cyan-400 text-sm">Total Scans</p>
                        <p className="text-2xl font-bold text-white">{scanStats.totalScans}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 backdrop-blur-md border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-sm">Successful</p>
                        <p className="text-2xl font-bold text-white">{scanStats.successScans}</p>
                      </div>
                      <User className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 backdrop-blur-md border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-400 text-sm">Failed</p>
                        <p className="text-2xl font-bold text-white">{scanStats.failedScans}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 backdrop-blur-md border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-400 text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-white">{scanStats.successRate}%</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}


            {/* Employee List */}
            <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Registered Employees ({employees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="text-cyan-400 mt-2">Loading employees...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/50 bg-gray-700 flex items-center justify-center">
                            <span className="text-cyan-400 font-bold text-lg">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{employee.name}</h3>
                            <p className="text-cyan-400 text-sm">ID: {employee.employeeId}</p>
                            <p className="text-gray-400 text-xs">{employee.specialty} • {employee.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="default"
                            className="bg-green-600/30 text-green-100 border-2 border-green-400/60 font-semibold"
                          >
                            Active
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                            title="Edit employee"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                            title="Permanently delete employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {employees.length === 0 && (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No employees registered yet</p>
                        <p className="text-gray-500 text-sm">Add your first employee to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "add" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
                <Plus className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Register New Employee</h1>
                <p className="text-cyan-400">Add employee to access system</p>
              </div>
            </div>

            <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)] max-w-2xl">
              <CardContent className="p-6 space-y-6">
                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label className="text-white">Employee Photo (Required for Face Recognition)</Label>
                  
                  {!showCamera ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all duration-300">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                          <p className="text-cyan-400 mb-2">Click to select photo</p>
                          <p className="text-gray-400 text-sm">or use camera below</p>
                        </label>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-3">or</p>
                        <Button
                          type="button"
                          onClick={initializeCamera}
                          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-6 py-2 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo with Camera
                        </Button>
                        <p className="text-gray-500 text-xs mt-2">Works with DroidCam, webcam, or phone camera</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Camera Selection */}
                      {availableCameras.length > 1 && (
                        <div className="space-y-2">
                          <Label className="text-white text-sm">Select Camera:</Label>
                          <select
                            value={selectedCameraId}
                            onChange={(e) => switchCamera(e.target.value)}
                            className="w-full p-2 bg-gray-900/50 border border-cyan-500/30 text-white rounded-lg focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                          >
                            {availableCameras.map((camera) => (
                              <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="relative bg-black rounded-lg overflow-hidden border-2 border-cyan-500/50">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-64 object-cover"
                          style={{ backgroundColor: 'black' }}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="button"
                            onClick={initializeCamera}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            title="Retry Camera"
                          >
                            🔄
                          </Button>
                          <Button
                            type="button"
                            onClick={stopCamera}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {!cameraStream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-center text-white">
                              <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Camera not active</p>
                              <p className="text-xs text-gray-400">Click retry button</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center space-y-2">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] transition-all duration-300"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Photo
                        </Button>
                        <p className="text-gray-400 text-sm">Position your face in the frame and click capture</p>
                        {availableCameras.length > 0 && (
                          <p className="text-cyan-400 text-xs">
                            Using: {availableCameras.find(c => c.deviceId === selectedCameraId)?.label || 'Default Camera'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-white">
                    Employee ID *
                  </Label>
                  <Input
                    id="employeeId"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    placeholder="EMP001"
                    className="bg-gray-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="John Doe"
                    className="bg-gray-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-white">
                    Specialty *
                  </Label>
                  <Input
                    id="specialty"
                    value={newEmployee.specialty}
                    onChange={(e) => setNewEmployee({ ...newEmployee, specialty: e.target.value })}
                    placeholder="Software Engineer"
                    className="bg-gray-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">
                    City *
                  </Label>
                  <Input
                    id="city"
                    value={newEmployee.city}
                    onChange={(e) => setNewEmployee({ ...newEmployee, city: e.target.value })}
                    placeholder="New York"
                    className="bg-gray-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  />
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white">
                    Birth Date *
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newEmployee.birthDate}
                    onChange={(e) => setNewEmployee({ ...newEmployee, birthDate: e.target.value })}
                    className="bg-gray-900/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  />
                </div>

                {/* Register Button */}
                <Button
                  onClick={handleAddEmployee}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] transition-all duration-300"
                >
                  Register Employee
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
                <History className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Scan History</h1>
                <p className="text-cyan-400">Monitor all access attempts and security events</p>
              </div>
            </div>

            <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  Recent Scan Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        scan.scanType === 'success'
                          ? 'bg-green-900/20 border-green-500/30 hover:border-green-500/50'
                          : 'bg-red-900/20 border-red-500/30 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            scan.scanType === 'success' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <p className={`font-semibold ${
                              scan.scanType === 'success' ? 'text-green-200' : 'text-red-200'
                            }`}>
                              {scan.scanType === 'success' 
                                ? `✓ Access Granted - ${scan.employee?.name || 'Unknown'}`
                                : '✗ Access Denied - Unknown Person'
                              }
                            </p>
                            <p className="text-gray-400 text-sm">
                              {new Date(scan.scannedAt).toLocaleString()}
                            </p>
                            {scan.confidence && (
                              <p className="text-gray-500 text-xs">
                                Confidence: {(scan.confidence * 100).toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">{scan.ipAddress}</p>
                          {scan.location && (
                            <p className="text-gray-500 text-xs">{scan.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {scanHistory.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No scan history available</p>
                      <p className="text-gray-500 text-sm">Scan attempts will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
                <Settings className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-cyan-400">Configure access control parameters</p>
              </div>
            </div>

            <Card className="bg-black/50 backdrop-blur-md border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
              <CardContent className="p-6">
                <p className="text-gray-400">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
