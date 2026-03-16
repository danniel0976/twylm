'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function CheeseMascot() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [xPercent, setXPercent] = useState(0) // 0-100% across container width

  // Walk from left (0%) to right (100%), then teleport back to start
  useEffect(() => {
    const walkInterval = setInterval(() => {
      setXPercent((prev) => {
        const next = prev + 5 // Move 5% every 200ms = full width in 4 seconds
        if (next >= 100) {
          return 0 // Teleport back to start
        }
        return next
      })
    }, 200) // 200ms per step

    return () => clearInterval(walkInterval)
  }, [])

  // Cycle through 4 walk frames
  useEffect(() => {
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % 4)
    }, 150) // 150ms per frame = walking pace

    return () => clearInterval(frameInterval)
  }, [])

  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{
        left: `${xPercent}%`,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <Image
          src={`/cheese-frames/chippy_walkcycle_0${currentFrame + 1}.png`}
          alt="Cheese the husky mascot walking"
          width={80}
          height={80}
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}
