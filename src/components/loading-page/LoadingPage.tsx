'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'

function PixelTrophy() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Cup body */}
      <rect x="3" y="1" width="10" height="7" fill="#FFD700" />
      {/* Handles */}
      <rect x="1" y="2" width="2" height="4" fill="#FFD700" />
      <rect x="13" y="2" width="2" height="4" fill="#FFD700" />
      {/* Cup top rim */}
      <rect x="3" y="0" width="10" height="1" fill="#FFF176" />
      {/* Shine */}
      <rect x="5" y="2" width="3" height="2" fill="#FFF9C4" opacity="0.7" />
      <rect x="5" y="2" width="1" height="1" fill="#FFFFFF" opacity="0.8" />
      {/* Stem */}
      <rect x="6" y="8" width="4" height="2" fill="#FFD700" />
      {/* Base */}
      <rect x="3" y="10" width="10" height="2" fill="#FFD700" />
      {/* Base highlight */}
      <rect x="3" y="10" width="10" height="1" fill="#FFF176" opacity="0.5" />
    </svg>
  )
}

function StarBurst({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360
        const rad = (angle * Math.PI) / 180
        const dist = 52
        const dx = Math.cos(rad) * dist
        const dy = Math.sin(rad) * dist
        const isLong = i % 2 === 0
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: isLong ? 6 : 4,
              height: isLong ? 6 : 4,
              marginLeft: isLong ? -3 : -2,
              marginTop: isLong ? -3 : -2,
              backgroundColor: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FFF9C4' : '#FFFFFF',
              imageRendering: 'pixelated' as const,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: dx, y: dy, opacity: [0, 1, 1, 0], scale: [0, 1, 0.8, 0] }}
            transition={{
              duration: 0.7,
              delay: i * 0.05,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </>
  )
}

function PixelHero({ frame }: { frame: 0 | 1 }) {
  const accentColor = 'var(--color-accent)'
  return (
    <svg
      width="40"
      height="48"
      viewBox="0 0 10 12"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Helmet */}
      <rect x="3" y="0" width="4" height="1" fill={accentColor} />
      {/* Head */}
      <rect x="2" y="1" width="6" height="3" fill="#FFDAB9" />
      {/* Eye */}
      <rect x="4" y="2" width="1" height="1" fill="#1a1a2e" />
      {/* Body */}
      <rect x="2" y="4" width="6" height="3" fill={accentColor} />
      {/* Belt */}
      <rect x="2" y="7" width="6" height="1" fill="#FFD700" />
      {/* Sword (right arm) */}
      <rect x="9" y="3" width="1" height="4" fill="#C0C0C0" />
      <rect x="8" y="4" width="1" height="2" fill="#C0C0C0" />
      {/* Shield (left arm) */}
      <rect x="0" y="4" width="2" height="3" fill={accentColor} />
      <rect x="0" y="5" width="2" height="1" fill="#FFD700" />
      {/* Legs */}
      {frame === 0 ? (
        <>
          <rect x="2" y="8" width="2" height="3" fill={accentColor} />
          <rect x="2" y="11" width="3" height="1" fill="#666" />
          <rect x="6" y="8" width="2" height="2" fill={accentColor} />
        </>
      ) : (
        <>
          <rect x="2" y="8" width="2" height="2" fill={accentColor} />
          <rect x="6" y="8" width="2" height="3" fill={accentColor} />
          <rect x="5" y="11" width="3" height="1" fill="#666" />
        </>
      )}
    </svg>
  )
}

const BAR_SEGMENTS = 14

export default function LoadingPage({ subtitle }: { subtitle?: string }) {
  const { T } = useLanguage()
  const [frame, setFrame] = useState<0 | 1>(0)
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 190)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 550)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-center items-center bg-bg-main select-none overflow-hidden">

      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
        }}
      />

      <div className="relative z-20 flex flex-col items-center gap-8">

        {/* Trophy + star burst */}
        <div className="relative flex items-center justify-center w-32 h-32">
          <StarBurst count={10} />
          <motion.div
            animate={{
              scale: [1, 1.06, 1],
              filter: [
                'drop-shadow(0 0 4px #FFD70050)',
                'drop-shadow(0 0 16px #FFD700cc)',
                'drop-shadow(0 0 4px #FFD70050)',
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PixelTrophy />
          </motion.div>
        </div>

        {/* Retro text */}
        <div className="flex flex-col items-center gap-1.5">
          <p
            className="font-mono text-base sm:text-lg text-text-main uppercase tracking-[0.2em]"
            style={{ textShadow: '0 0 8px var(--color-accent)' }}
          >
            {subtitle ?? T.loadingPage.title}
            <span style={{ opacity: cursorOn ? 1 : 0 }}>_</span>
          </p>
          <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest opacity-50">
            {T.loadingPage.subtitle}
          </p>
        </div>

        {/* Pixel progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: BAR_SEGMENTS }).map((_, i) => (
            <motion.div
              key={i}
              style={{
                width: 14,
                height: 8,
                imageRendering: 'pixelated',
                backgroundColor: 'var(--color-accent)',
              }}
              animate={{ opacity: [0.12, 1, 0.12] }}
              transition={{
                duration: BAR_SEGMENTS * 0.12,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'linear',
              }}
            />
          ))}
        </div>

      </div>

      {/* Walking hero at bottom */}
      <div className="absolute bottom-8 left-0 w-full z-20 pointer-events-none">
        <motion.div
          style={{ position: 'absolute', bottom: 0 }}
          animate={{ x: ['-48px', 'calc(100vw + 48px)'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
        >
          <PixelHero frame={frame} />
        </motion.div>
      </div>

    </div>
  )
}
