import React, { useState, useEffect } from 'react'

export function Footer() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0]
  }

  return (
    <footer className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-md py-xs z-30 border-t border-outline-variant bg-surface-container-low h-[48px]">
      <div className="flex items-center gap-md text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-xs text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Terminal Active
        </span>
        <span>•</span>
        <span className="font-data-mono text-data-mono">{formatTime(time)}</span>
      </div>
    </footer>
  )
}
