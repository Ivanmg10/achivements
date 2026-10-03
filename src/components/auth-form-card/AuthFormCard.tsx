import type { ReactNode } from 'react'

/**
 * The surface a sign-in or register form sits on: frosted, so the drifting
 * game art behind it shows through without fighting the fields. Falls back
 * to a near-solid card where transparency is turned down.
 */
export default function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-bg-card/75 backdrop-blur-xl ring-1 ring-ink/[0.07] shadow-2xl shadow-black/40 px-5 py-7 sm:px-8 sm:py-9 motion-safe:transition-shadow contrast-more:bg-bg-card [@media(prefers-reduced-transparency:reduce)]:bg-bg-card">
      {children}
    </div>
  )
}
