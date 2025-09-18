"use client"

import { useEffect, useState } from 'react'

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    const init = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electron?.isMaximized) {
          const maximized = await (window as any).electron.isMaximized()
          setIsMaximized(!!maximized)
          cleanup = (window as any).electron.onDidChangeMaximize?.(() => {
            ;(window as any).electron.isMaximized().then((m: boolean) => setIsMaximized(!!m))
          })
        }
      } catch {}
    }
    init()
    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' as any }}>
      <button
        onClick={() => (window as any).electron?.minimize?.()}
        aria-label="Minimize"
        className="h-8 w-8 grid place-items-center rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300 group"
      >
        <div className="w-3 h-0.5 bg-cyan-300 group-hover:bg-cyan-200 transition-colors"></div>
      </button>
      <button
        onClick={() => {
          const api = (window as any).electron
          if (!api) return
          if (isMaximized) api.unmaximize?.()
          else api.maximize?.()
        }}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        className="h-8 w-8 grid place-items-center rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300 group"
      >
        {isMaximized ? (
          <div className="relative w-3 h-3">
            <div className="absolute top-0 left-0 w-2 h-2 border border-cyan-300 group-hover:border-cyan-200 transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border border-cyan-300 group-hover:border-cyan-200 transition-colors"></div>
          </div>
        ) : (
          <div className="w-3 h-3 border border-cyan-300 group-hover:border-cyan-200 transition-colors"></div>
        )}
      </button>
      <button
        onClick={() => (window as any).electron?.close?.()}
        aria-label="Close"
        className="h-8 w-8 grid place-items-center rounded-md bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-300 group"
      >
        <div className="relative w-3 h-3">
          <div className="absolute top-1/2 left-1/2 w-3 h-0.5 bg-red-300 group-hover:bg-red-200 transition-colors transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
          <div className="absolute top-1/2 left-1/2 w-3 h-0.5 bg-red-300 group-hover:bg-red-200 transition-colors transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
        </div>
      </button>
    </div>
  )
}


