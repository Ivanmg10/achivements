'use client'

import RouteError from '@/components/route-error/RouteError'

export default function MainError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />
}
