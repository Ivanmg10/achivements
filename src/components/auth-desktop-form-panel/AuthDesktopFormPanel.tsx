import type { ReactNode } from 'react'
import AuthBrand from '@/components/auth-brand/AuthBrand'
import AuthFormCard from '@/components/auth-form-card/AuthFormCard'

/**
 * A desktop half holding a form: the brand over the card, both centred, on the
 * page's own ground. Scrolls rather than clips when the window is short.
 */
export default function AuthDesktopFormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center gap-8 py-12">
      <AuthBrand />
      <div className="w-full">
        <AuthFormCard>{children}</AuthFormCard>
      </div>
    </div>
  )
}
