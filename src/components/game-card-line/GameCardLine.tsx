import type { ReactNode } from 'react'

/** One small line of a game card under its bar (points, last played, finished). */
export default function GameCardLine({ children }: { children: ReactNode }) {
  return <span className="text-xs text-text-secondary mt-1">{children}</span>
}
