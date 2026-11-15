'use client'

import RouteError from '@/components/route-error/RouteError'

/** The welcome has no layout around it, so the error takes the whole screen. */
export default function WelcomeError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} fullScreen />
}
