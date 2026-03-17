'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function CheeseMascot() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [xPercent, setXPercent] = useState(0) // 0-100% across container width

  // Walk from left (0%) to right (100%), then teleport back to start
  // Full width: edge to edge of screen (mobile: -mx-4 extends beyond viewport)
  useEffect(() => {
    const walkInterval = setInterval(() => {
      setXPercent((prev) => {
        const next = prev + 2 // Move 2% every 500ms = full width in 25 seconds
        if (next >= 100) {
          return 0 // Teleport back to 0%
        }
        return next
      })
    }, 500) // 500ms per step

    return () => clearInterval(walkInterval)
  }, [])

  // Cycle through 4 walk frames - frame 4 (looking at user) appears rarely
  useEffect(() => {
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = (prev + 1) % 4
        // Skip frame 4 (index 3) 80% of the time - stay on frame 3 instead
        // Only show frame 4 (looking at user) 20% of the time
        if (next === 3 && Math.random() > 0.2) {
          return 2 // Stay on frame 3 (last walking frame)
        }
        return next
      })
    }, 200) // 200ms per frame

    return () => clearInterval(frameInterval)
  }, [])

  return (
    <div
      className="absolute z-10 pointer-events-none overflow-hidden"
      style={{
        left: `${Math.max(5, Math.min(95, xPercent))}%`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '128px',
        marginLeft: '-64px', // Center the 128px wide mascot on the percentage point
      }}
    >
      <div className="relative w-32 h-32">
        <Image
          src={`/cheese-frames/chippy_walkcycle_0${currentFrame + 1}.png`}
          alt="Cheese the husky mascot walking"
          width={128}
          height={128}
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}
