'use client'

import RouteError from '@/components/route-error/RouteError'

/** Sign-in, sign-up and password reset: no layout around them, so the error takes the whole screen. */
export default function AuthError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} fullScreen />
}
