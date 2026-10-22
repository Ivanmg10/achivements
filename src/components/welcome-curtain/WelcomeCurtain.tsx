'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { display } from '@/lib/fonts'
import styles from './WelcomeCurtain.module.css'

/** One end of the curtain's journey: a name, a mark in a white disc, and its sky. */
export type CurtainNode = { label: string; mark: ReactNode; sky: string }

function Node({ node, at, reached }: { node: CurtainNode; at: string; reached: boolean }) {
  return (
    <span className="absolute top-[calc(52%-36px)] flex flex-col items-center gap-3 -translate-x-1/2" style={{ left: at }}>
      <span className={`w-18 h-18 rounded-full bg-white text-[#1d1640] flex items-center justify-center ${reached ? 'ring-[6px] ring-white/25' : ''}`}>
        {node.mark}
      </span>
      <span className="font-display italic font-extrabold text-3xl text-white whitespace-nowrap">{node.label}</span>
    </span>
  )
}

/**
 * What covers the screen while the welcome changes step (and on the way in
 * from sign-up), after the change of day in Inazuma Eleven: Victory Road: a
 * chevron-edged panel sweeps across, a band inside it travels from `from` to
 * `to` while its sky turns into the new one's, and the panel leaves.
 *
 * `offsetMs` starts it part way through and `holdAtMs` freezes it there (all
 * covered): the sign-up page holds it while the welcome loads, and the
 * welcome picks it up at the same point. Decorative: it says nothing to a
 * screen reader and takes no clicks.
 */
export default function WelcomeCurtain({
  from,
  to,
  word,
  direction = 'forward',
  offsetMs = 0,
  holdAtMs,
}: {
  from: CurtainNode
  to: CurtainNode
  word: string
  direction?: 'forward' | 'back'
  offsetMs?: number
  holdAtMs?: number
}) {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (holdAtMs === undefined) return
    const timer = setTimeout(() => setHeld(true), holdAtMs - offsetMs)
    return () => clearTimeout(timer)
  }, [holdAtMs, offsetMs])

  const forward = direction === 'forward'
  const line = `${word} · ${word} · ${word}`

  return (
    <div
      aria-hidden="true"
      data-held={held || undefined}
      className={`${display.variable} ${styles.root} ${held ? styles.held : ''} fixed inset-0 z-40 pointer-events-none overflow-hidden`}
      style={{ '--curtain-offset': `${-offsetMs}ms` } as CSSProperties}
    >
      <div className={`${styles.panel} ${forward ? '' : styles.panelBack} absolute inset-y-0 -left-[70px] w-[calc(100%+140px)] overflow-hidden`}>
        <div className={`${styles.word} absolute left-0 top-10 whitespace-nowrap font-display italic font-extrabold text-[clamp(160px,22vw,340px)] leading-none`}>
          {line}
        </div>
        <div className={`${styles.word} absolute -left-48 -bottom-14 whitespace-nowrap font-display italic font-extrabold text-[clamp(160px,22vw,340px)] leading-none`}>
          {line}
        </div>
        <div className={`${styles.band} ${styles.echo2} absolute inset-y-0`} />
        <div className={`${styles.band} ${styles.echo1} absolute inset-y-0`} />
        <div className={`${styles.band} absolute inset-y-0 overflow-hidden`}>
          <div className="absolute inset-0" style={{ background: from.sky }} />
          <div className={`${styles.toSky} absolute inset-0`} style={{ background: to.sky }} />
        </div>
        <div className="absolute left-[70px] right-[70px] top-[52%] h-0.5 bg-white/60" />
        <Node node={from} at={forward ? '32%' : '66%'} reached={false} />
        <Node node={to} at={forward ? '66%' : '32%'} reached />
      </div>
    </div>
  )
}
