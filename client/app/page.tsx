"use client"

import { useState } from "react"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserDashboard } from "@/components/user-dashboard"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [currentView, setCurrentView] = useState<"admin" | "user">("admin")

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      </div>

      {/* View toggle */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => setCurrentView("admin")}
          variant={currentView === "admin" ? "default" : "outline"}
          className={`${
            currentView === "admin"
              ? "bg-cyan-500 hover:bg-cyan-600 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              : "border-2 border-cyan-400 text-cyan-100 bg-black/50 hover:bg-cyan-500 hover:text-black font-semibold"
          } transition-all duration-300`}
        >
          Admin Control
        </Button>
        <Button
          onClick={() => setCurrentView("user")}
          variant={currentView === "user" ? "default" : "outline"}
          className={`${
            currentView === "user"
              ? "bg-cyan-500 hover:bg-cyan-600 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              : "border-2 border-cyan-400 text-cyan-100 bg-black/50 hover:bg-cyan-500 hover:text-black font-semibold"
          } transition-all duration-300`}
        >
          User Access
        </Button>
      </div>

      {/* Main content */}
      <div className="relative z-10">{currentView === "admin" ? <AdminDashboard /> : <UserDashboard />}</div>
    </div>
  )
}
