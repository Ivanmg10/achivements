import type { ReactNode } from 'react'

/** The surface a sign-in or register form sits on: a plain card, no glass and no glow. */
export default function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md mx-auto rounded-card bg-bg-card ring-1 ring-ink/[0.07] px-5 py-7 sm:px-8 sm:py-9 enter-card">
      {children}
    </div>
  )
}
