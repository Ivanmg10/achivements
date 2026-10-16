'use client'

import RouteError from '@/components/route-error/RouteError'

/** Sign-in, sign-up and password reset: a page that throws keeps the app around it, with a retry. */
export default function AuthError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />
}
