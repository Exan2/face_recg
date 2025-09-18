"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Shield, CheckCircle, XCircle, Scan, Eye, Zap, AlertTriangle } from "lucide-react"

interface Employee {
  id: number
  employeeId: string
  name: string
  specialty: string
  city: string
  birthDate: string
  isActive: boolean
}

interface ScanResult {
  recognized: boolean
  employee?: Employee
  confidence?: number
  message: string
}

export function UserDashboard() {
  const [isScanning, setIsScanning] = useState(false)
  const [accessStatus, setAccessStatus] = useState<"idle" | "granted" | "denied">("idle")
  const [detectedUser, setDetectedUser] = useState<Employee | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [confidence, setConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'

  // Initialize camera on component mount
  useEffect(() => {
    initializeCamera()
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Camera access denied. Please allow camera permissions.')
    }
  }

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ Video or canvas ref not available')
      return null
    }
    
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) {
      console.log('❌ Canvas context not available')
      return null
    }
    
    console.log('📸 Video dimensions:', video.videoWidth, 'x', video.videoHeight)
    console.log('📸 Video ready state:', video.readyState)
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('❌ Video has no dimensions')
      return null
    }
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)
    console.log('📸 Captured image data URL length:', dataURL.length)
    
    return dataURL
  }

  const performFaceRecognition = async (): Promise<ScanResult> => {
    try {
      console.log('🔍 Starting face recognition...')
      const imageData = captureImage()
      if (!imageData) {
        throw new Error('Failed to capture image')
      }

      console.log('📸 Converting data URL to blob...')
      // Convert data URL to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      console.log('📸 Blob size:', blob.size, 'bytes')
      
      const formData = new FormData()
      formData.append('image', blob, 'scan.jpg')
      console.log('📤 Sending request to:', `${API_BASE}/api/scan/recognize`)

      const result = await fetch(`${API_BASE}/api/scan/recognize`, {
        method: 'POST',
        body: formData
      })

      console.log('Scan API response status:', result.status)
      console.log('Scan API response headers:', result.headers)

      if (!result.ok) {
        const errorText = await result.text()
        console.error('Scan API error response:', errorText)
        throw new Error(`Face recognition service unavailable (${result.status}): ${errorText}`)
      }

      return await result.json()
    } catch (error) {
      console.error('Face recognition error:', error)
      throw error
    }
  }

  const startScan = async () => {
    if (!cameraStream) {
      setError('Camera not available. Please check camera permissions.')
      return
    }

    setIsScanning(true)
    setAccessStatus("idle")
    setScanProgress(0)
    setError(null)
    setDetectedUser(null)
    setConfidence(0)

    // Progress animation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 50)

    try {
      // Wait a bit for camera to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = await performFaceRecognition()
      
      clearInterval(progressInterval)
      setScanProgress(100)
      
      if (result.recognized && result.employee) {
        setAccessStatus("granted")
        setDetectedUser(result.employee)
        setConfidence(result.confidence || 0)
      } else {
        setAccessStatus("denied")
        setDetectedUser(null)
        setConfidence(result.confidence || 0)
      }
    } catch (error) {
      console.error('Scan error:', error)
      setError('Face recognition failed. Please try again.')
      setAccessStatus("denied")
    } finally {
      setIsScanning(false)
      setTimeout(() => {
        setScanProgress(0)
        setAccessStatus("idle")
      }, 5000) // Reset after 5 seconds
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-slate-900 relative">
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      <div className="absolute inset-0 neural-network"></div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent data-stream opacity-15"
            style={{
              top: `${20 + i * 15}%`,
              width: "200px",
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent scan-line opacity-60" />
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-8 space-y-6 relative z-10">
        <div className="text-center space-y-6 mb-8">
          <div className="flex items-center justify-center gap-6">
            <div className="relative p-6 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 glow-pulse">
              <Shield className="w-16 h-16 text-blue-400" />
              <div className="absolute inset-0 bg-blue-400/5 rounded-xl hologram-flicker"></div>
            </div>
            <div className="text-left">
              <h1 className="text-6xl font-bold text-slate-100 mb-2 hologram-flicker">SECURE ACCESS</h1>
              <p className="text-blue-400 text-2xl font-mono">BIOMETRIC VERIFICATION SYSTEM</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm font-mono">SYSTEM OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 h-[600px]">
          <Card className="col-span-2 bg-slate-800/80 backdrop-blur-xl border-2 border-slate-600/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] glow-pulse">
            <CardContent className="p-6 h-full">
              <div className="relative h-full bg-slate-900/60 rounded-xl border-2 border-slate-600/50 overflow-hidden">
                {cameraStream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-blue-500/10">
                        <div className="absolute inset-8 border-2 border-blue-400 rounded-xl">
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 animate-pulse"></div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 animate-pulse"></div>
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 animate-pulse"></div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 to-slate-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-32 h-32 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Camera not available</p>
                      <p className="text-slate-500 text-sm">Please allow camera permissions</p>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-0 bg-blue-500/5">
                    <div className="absolute inset-8 border-2 border-blue-400 rounded-xl">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 animate-pulse"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 animate-pulse"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 animate-pulse"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 animate-pulse"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="relative">
                          <Scan className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-spin" />
                          <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
                        </div>
                        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-600/40">
                          <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-blue-400" />
                            <span className="text-blue-400 font-mono text-lg font-bold">ANALYZING BIOMETRICS</span>
                          </div>
                          <p className="text-slate-300 text-xl font-mono font-bold mb-4">VERIFICATION IN PROGRESS</p>
                          <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                              style={{ width: `${scanProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-slate-400 text-sm font-mono">{scanProgress}% COMPLETE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <svg width="32" height="32" className="text-blue-400 circuit-glow">
                    <path d="M0 8 L8 8 L8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,2" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4">
                  <svg width="32" height="32" className="text-blue-400 circuit-glow">
                    <path
                      d="M32 8 L24 8 L24 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4,2"
                    />
                  </svg>
                </div>
                <div className="absolute bottom-4 left-4">
                  <svg width="32" height="32" className="text-blue-400 circuit-glow">
                    <path
                      d="M0 24 L8 24 L8 32"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4,2"
                    />
                  </svg>
                </div>
                <div className="absolute bottom-4 right-4">
                  <svg width="32" height="32" className="text-blue-400 circuit-glow">
                    <path
                      d="M32 24 L24 24 L24 32"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4,2"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-slate-800/80 backdrop-blur-xl border-2 border-slate-600/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <CardContent className="p-8 h-full flex items-center justify-center">
              <div className="text-center space-y-8 w-full">
                {accessStatus === "idle" && !isScanning && (
                  <div className="space-y-6">
                    <div className="relative p-6 rounded-full bg-blue-500/10 border-2 border-blue-500/30 w-fit mx-auto glow-pulse">
                      <Zap className="w-16 h-16 text-blue-400" />
                      <div className="absolute inset-0 bg-blue-400/5 rounded-full hologram-flicker"></div>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-100 font-mono">SYSTEM READY</h2>
                    <p className="text-blue-400 text-lg">Position face within scanning area</p>
                    <div className="space-y-2">
                      <div className="text-slate-300 text-sm font-mono">BIOMETRIC SCANNER: ACTIVE</div>
                      <div className="text-slate-300 text-sm font-mono">DATABASE: CONNECTED</div>
                    </div>
                    <button
                      onClick={startScan}
                      disabled={!cameraStream || isScanning}
                      className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:scale-105"
                    >
                      {isScanning ? "SCANNING..." : "INITIATE SCAN"}
                    </button>
                  </div>
                )}

                {isScanning && (
                  <div className="space-y-6">
                    <div className="relative p-6 rounded-full bg-blue-500/20 border-2 border-blue-500/40 w-fit mx-auto">
                      <Scan className="w-16 h-16 text-blue-400 animate-spin" />
                      <div className="absolute inset-0 bg-blue-400/10 rounded-full animate-ping"></div>
                    </div>
                    <h2 className="text-4xl font-bold text-blue-400 font-mono hologram-flicker">PROCESSING...</h2>
                    <div className="space-y-2">
                      <p className="text-slate-300 font-mono">FACIAL RECOGNITION: ACTIVE</p>
                      <p className="text-slate-300 font-mono">BIOMETRIC MATCH: SEARCHING</p>
                      <p className="text-slate-300 font-mono">DATABASE: QUERYING</p>
                    </div>
                  </div>
                )}

                {accessStatus === "granted" && detectedUser && (
                  <div className="space-y-6 access-granted">
                    <div className="relative p-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 w-fit mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle className="w-16 h-16 text-emerald-400" />
                      <div className="absolute inset-0 bg-emerald-400/10 rounded-full animate-ping"></div>
                    </div>
                    <h2 className="text-5xl font-bold text-emerald-400 font-mono">ACCESS GRANTED</h2>
                    <p className="text-slate-100 text-2xl font-mono">WELCOME, {detectedUser.name.toUpperCase()}!</p>
                    <div className="space-y-2 text-center">
                      <p className="text-slate-300 font-mono">ID: {detectedUser.employeeId}</p>
                      <p className="text-slate-300 font-mono">{detectedUser.specialty}</p>
                      <p className="text-slate-300 font-mono">{detectedUser.city}</p>
                      {confidence > 0 && (
                        <p className="text-emerald-300 font-mono">Confidence: {(confidence * 100).toFixed(1)}%</p>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 px-6 py-3 text-xl font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      AUTHORIZED USER
                    </Badge>
                    <div className="text-emerald-300 text-sm font-mono">CLEARANCE: VERIFIED</div>
                  </div>
                )}

                {accessStatus === "denied" && (
                  <div className="space-y-6 access-denied">
                    <div className="relative p-6 rounded-full bg-red-500/20 border-2 border-red-500/40 w-fit mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                      <XCircle className="w-16 h-16 text-red-400" />
                      <div className="absolute inset-0 bg-red-400/10 rounded-full animate-ping"></div>
                    </div>
                    <h2 className="text-5xl font-bold text-red-400 font-mono">ACCESS DENIED</h2>
                    <p className="text-red-300 text-xl font-mono">UNAUTHORIZED ACCESS ATTEMPT</p>
                    {confidence > 0 && (
                      <p className="text-red-300 font-mono">Confidence: {(confidence * 100).toFixed(1)}%</p>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 text-red-300">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-mono text-sm">{error}</p>
                      </div>
                    )}
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-red-500/40 px-6 py-3 text-xl font-mono shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      SECURITY ALERT
                    </Badge>
                    <div className="text-red-300 text-sm font-mono">INCIDENT LOGGED</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
