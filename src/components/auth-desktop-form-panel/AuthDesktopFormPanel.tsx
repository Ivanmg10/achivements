import type { ReactNode } from 'react'
import AuthBrand from '@/components/auth-brand/AuthBrand'
import AuthFormCard from '@/components/auth-form-card/AuthFormCard'

/**
 * A desktop half holding a form: brand over the card, both centred, with a
 * faint glow in the theme's accent so the card does not float on flat black.
 * Scrolls rather than clips when the window is short.
 */
export default function AuthDesktopFormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center gap-8 py-12">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgb(var(--accent)/0.09),transparent_65%)]" />
      <div className="relative">
        <AuthBrand />
      </div>
      <div className="relative w-full">
        <AuthFormCard>{children}</AuthFormCard>
      </div>
    </div>
  )
}
