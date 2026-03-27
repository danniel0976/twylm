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
  // Sequence is always complete: 1>2>3>4 or 1>2>3>1, never skip frame 4 mid-cycle
  useEffect(() => {
    let skipFrame4 = false
    
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => {
        // When at frame 3 (index 2), decide whether to show frame 4 or loop to 1
        if (prev === 2) {
          // Decide at the START of the cycle (when transitioning from frame 3)
          skipFrame4 = Math.random() > 0.2 // 80% chance to skip frame 4
          if (skipFrame4) {
            return 0 // Loop back to frame 1 (sequence: 1>2>3>1)
          }
          return 3 // Continue to frame 4 (sequence: 1>2>3>4)
        }
        
        // When at frame 4 (index 3), always loop to frame 1
        if (prev === 3) {
          return 0
        }
        
        // Otherwise, just advance to next frame
        return prev + 1
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
