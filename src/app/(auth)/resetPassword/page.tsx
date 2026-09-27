import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordForm from '@/components/reset-password-form/ResetPasswordForm'

// A one-off page reached from an email, with a token in the URL: never worth indexing.
export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

/** Where the link in the recovery email lands. Open to anyone: the token is the proof. */
export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-bg-main text-text-main flex items-center justify-center px-6">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
