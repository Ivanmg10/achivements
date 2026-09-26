import { Suspense } from 'react'
import ResetPasswordForm from '@/components/reset-password-form/ResetPasswordForm'

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
