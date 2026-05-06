'use client'

import { motion } from 'framer-motion'

function ArcTrack({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  const r = (size - strokeWidth * 2) / 2
  const c = 2 * Math.PI * r
  const arc = c * 0.25
  return (
    <circle
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      strokeWidth={strokeWidth}
      stroke="var(--color-accent)"
      strokeLinecap="round"
      strokeDasharray={`${arc} ${c - arc}`}
      opacity={0.12}
      style={{ transform: 'rotate(-90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
    />
  )
}

export default function Spinner({ size = 45 }: { size?: number }) {
  // Below 20px — simple CSS ring (reliable inside buttons)
  if (size < 20) {
    const sw = size <= 12 ? 1.5 : 2
    return (
      <div
        className="rounded-full animate-spin shrink-0"
        style={{
          width: size,
          height: size,
          border: `${sw}px solid transparent`,
          borderTopColor: 'var(--color-accent)',
          borderRightColor: 'rgba(var(--text-secondary), 0.25)',
        }}
      />
    )
  }

  const isLarge = size >= 36
  const dotCount = isLarge ? 10 : 8
  const outerR = size * (isLarge ? 0.37 : 0.36)
  const dotR = size * (isLarge ? 0.072 : 0.085)
  const cx = size / 2
  const cy = size / 2
  const waveDuration = 1.5

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Track arc hint */}
      {isLarge && <ArcTrack size={size} strokeWidth={1} />}

      {/* Wave dots */}
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2
        const x = cx + outerR * Math.cos(angle)
        const y = cy + outerR * Math.sin(angle)
        const delay = (i / dotCount) * waveDuration

        return isLarge ? (
          <motion.rect
            key={i}
            x={x - dotR}
            y={y - dotR}
            width={dotR * 2}
            height={dotR * 2}
            rx={dotR * 0.45}
            fill="var(--color-accent)"
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{ duration: waveDuration, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ) : (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={dotR}
            fill="var(--color-accent)"
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{ duration: waveDuration, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        )
      })}

      {/* Center star — only on large */}
      {isLarge && (
        <motion.text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.27}
          fill="var(--color-accent)"
          style={{ userSelect: 'none' }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.88, 1.08, 0.88] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ★
        </motion.text>
      )}
    </svg>
  )
}
