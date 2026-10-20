'use client'

import RouteError from '@/components/route-error/RouteError'

export default function MainError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} />
}
