'use client'

import NotFoundScreen from '@/components/not-found-screen/NotFoundScreen'

/**
 * Any URL that matches nothing, and a notFound() with no closer not-found.tsx
 * (inside the app, `(main)/not-found.tsx` takes it). Answers with a real 404.
 */
export default function NotFound() {
  return <NotFoundScreen fullScreen />
}
