'use client'

import { useState } from 'react'
import styles from './ViewEntrance.module.css'

interface Props {
  kind: 'feed' | 'tile'
  /** Position in the list, for the stagger. */
  index: number
  /** Whether to play when it mounts. Read once: a later change never cuts a running entrance. */
  play?: boolean
  onStart?: () => void
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * One item of the home's left card list making its entrance (CSS keyframes in
 * ViewEntrance.module.css: `feed` runs in from the left, `tile` rises and settles).
 * The class is there from the first render, like the heatmap's cells: the
 * compositor plays it even while a first load keeps the main thread busy.
 * Never wait for a frame or idle time first: the rows would sit invisible.
 */
export default function ViewEntrance({ kind, index, play = true, onStart, className = '', style, children }: Props) {
  const [animate] = useState(play)

  return (
    <div
      className={`${animate ? styles[kind] : ''} ${className}`}
      style={{ ...style, '--i': index } as React.CSSProperties}
      onAnimationStart={onStart ? (e) => e.target === e.currentTarget && onStart() : undefined}
    >
      {children}
    </div>
  )
}
