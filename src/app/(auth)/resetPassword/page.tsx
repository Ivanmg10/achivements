import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordForm from '@/components/reset-password-form/ResetPasswordForm'
import { Skeleton } from '@/components/ui/Skeleton'
import AuthFormSkeleton from '@/components/auth-form-skeleton/AuthFormSkeleton'

// A one-off page reached from an email, with a token in the URL: never worth indexing.
export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

/** Where the link in the recovery email lands. Open to anyone: the token is the proof. */
export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-bg-main text-text-main flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
            <Skeleton className="h-8 w-48 mx-auto" />
            <AuthFormSkeleton />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
