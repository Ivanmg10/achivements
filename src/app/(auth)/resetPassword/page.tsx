import type { Metadata } from 'next'
import AuthPage from '@/components/auth-page/AuthPage'
import ResetPasswordForm from '@/components/reset-password-form/ResetPasswordForm'

// A one-off page reached from an email, with a token in the URL: never worth indexing.
export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ token?: string | string[] }> }

/**
 * Where the link in the recovery email lands. Open to anyone: the token is the proof.
 * It wears the sign-in's layout (the art wall and the card), so a stale link is not a lone notice.
 * The token is read on the server, as the sign-in's `steam` is, so the form needs no Suspense.
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  return <AuthPage wantsRegister={false} steam={null} form={<ResetPasswordForm token={typeof token === 'string' ? token : ''} />} />
}
