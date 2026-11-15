'use client'

import type { ReactNode } from 'react'
import { useEnterOnView } from '@/hooks/useEnterOnView'

/**
 * A block that enters as it is scrolled to, with one of the library's entrances (`entrance`, `.enter-rise` by
 * default): what a long page below its first screen wraps its sections in. Visible without JavaScript and
 * until it has been seen below the screen (`useEnterOnView`). `className` is for layout only.
 */
export default function EnterOnView({ entrance, className = '', children }: { entrance?: string; className?: string; children: ReactNode }) {
  const { ref, className: stage } = useEnterOnView(entrance)
  return (
    <div ref={ref} className={`${stage} ${className}`}>
      {children}
    </div>
  )
}
