'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'

function PixelTrophy() {
  return (
    <svg width="48" height="48" viewBox="0 0 12 12" style={{ imageRendering: 'pixelated' }}>
      {/* Handles */}
      <rect x="1" y="2" width="2" height="3" fill="#FFD700" />
      <rect x="9" y="2" width="2" height="3" fill="#FFD700" />
      {/* Cup */}
      <rect x="3" y="1" width="6" height="5" fill="#FFD700" />
      {/* Shine */}
      <rect x="4" y="2" width="2" height="2" fill="#FFF9C4" opacity="0.8" />
      {/* Stem */}
      <rect x="5" y="6" width="2" height="2" fill="#FFD700" />
      {/* Base */}
      <rect x="3" y="8" width="6" height="2" fill="#FFD700" />
    </svg>
  )
}

// Zorua — dark fox pokemon, side view facing right
// frame 0: front legs forward / frame 1: rear legs forward
function Zorua({ frame }: { frame: 0 | 1 }) {
  const D = '#252030'   // dark body
  const R = '#cc2200'   // red (ear tips, tail tip)
  const C = '#f0dfc0'   // cream (chest, muzzle)
  const E = '#5de0e6'   // teal eye

  return (
    <svg width="54" height="36" viewBox="0 0 18 12" style={{ imageRendering: 'pixelated' }}>
      {/* Tail (left, curving up) */}
      <rect x="0" y="3" width="1" height="1" fill={R} />
      <rect x="1" y="3" width="1" height="1" fill={D} />
      <rect x="1" y="4" width="2" height="2" fill={D} />

      {/* Body */}
      <rect x="3" y="4" width="8" height="4" fill={D} />

      {/* Cream chest */}
      <rect x="8" y="5" width="3" height="2" fill={C} />

      {/* Head */}
      <rect x="11" y="2" width="5" height="5" fill={D} />

      {/* Left ear tip */}
      <rect x="11" y="1" width="1" height="1" fill={R} />
      {/* Right ear tip */}
      <rect x="14" y="1" width="1" height="1" fill={R} />

      {/* Forehead marking (blue teardrop — Zorua's signature) */}
      <rect x="12" y="2" width="1" height="2" fill="#7ec8e3" />

      {/* Eye */}
      <rect x="15" y="3" width="1" height="1" fill={E} />

      {/* Cream muzzle */}
      <rect x="15" y="5" width="2" height="2" fill={C} />
      <rect x="16" y="4" width="1" height="1" fill={C} />

      {/* Legs */}
      {frame === 0 ? (
        <>
          {/* Front legs: right leg (near head) forward+down */}
          <rect x="11" y="8" width="2" height="3" fill={D} />
          <rect x="12" y="11" width="2" height="1" fill={D} />
          {/* Rear legs: left leg (near tail) back+up */}
          <rect x="4"  y="8" width="2" height="2" fill={D} />
        </>
      ) : (
        <>
          {/* Front legs: right leg up */}
          <rect x="11" y="8" width="2" height="2" fill={D} />
          {/* Rear legs: left leg down */}
          <rect x="4"  y="8" width="2" height="3" fill={D} />
          <rect x="3"  y="11" width="2" height="1" fill={D} />
        </>
      )}
    </svg>
  )
}

export default function LoadingPage({ subtitle }: { subtitle?: string }) {
  const { T } = useLanguage()
  const [frame, setFrame] = useState<0 | 1>(0)
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-center items-center bg-bg-main select-none overflow-hidden">

      <div className="flex flex-col items-center gap-8">

        {/* Trophy */}
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 4px #FFD70040)',
              'drop-shadow(0 0 12px #FFD700aa)',
              'drop-shadow(0 0 4px #FFD70040)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PixelTrophy />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-sm text-text-main uppercase tracking-[0.18em]">
            {subtitle ?? T.loadingPage.title}
            <span style={{ opacity: cursorOn ? 1 : 0 }}>_</span>
          </p>
        </div>

        {/* 3 dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5"
              style={{ backgroundColor: 'var(--color-accent)', imageRendering: 'pixelated' }}
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

      </div>

      {/* Zorua walking at the bottom */}
      <div className="absolute bottom-10 left-0 w-full pointer-events-none">
        <motion.div
          style={{ position: 'absolute', bottom: 0 }}
          animate={{ x: ['-60px', 'calc(100vw + 60px)'] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        >
          <Zorua frame={frame} />
        </motion.div>
      </div>

    </div>
  )
}
