import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import WindowControls from '@/components/window-controls'

export const metadata: Metadata = {
  title: 'FACERECG',
  description: 'FACERECG desktop application',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* App Top Bar (draggable) */}
        <header className="sticky top-0 z-50 select-none shadow-[0_0_25px_rgba(0,255,255,0.08)] overflow-hidden"
          style={{ WebkitAppRegion: 'drag' } as any}>
          {/* Animated background to match dashboard */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/80 to-black" />
          <div className="absolute inset-0 cyber-grid opacity-20" />
          <div className="absolute inset-0 neural-network" />

          <div className="relative px-4 h-12 flex items-center justify-between backdrop-blur-md supports-[backdrop-filter]:bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-0.5"></div>
              <img src="/face-recognition.png" alt="FACERECG" className="h-6 w-6" />
              <span className="text-cyan-400 font-bold tracking-wide hologram-flicker">FACERECG</span>
            </div>
            <WindowControls />
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
