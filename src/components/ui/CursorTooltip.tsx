'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { tooltipStyle } from '@/utils/tooltipStyle'
import { TOOLTIP_SURFACE } from './tooltip'

/**
 * The tooltip a grid of badges shows beside the pointer: on `<body>`, so no
 * ancestor's transform traps it, kept inside the screen. The caller decides
 * when it is shown (it renders nothing without a browser) and what it says.
 */
export default function CursorTooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div role="tooltip" className={`fixed z-50 pointer-events-none ${TOOLTIP_SURFACE} p-3 max-w-65`} style={tooltipStyle(x, y, window.innerWidth, window.innerHeight)}>
      {children}
    </div>,
    document.body,
  )
}
