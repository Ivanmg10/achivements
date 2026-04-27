'use client'

import { ThemeProvider } from '@/context/ThemeContext'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /* istanbul ignore next */
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'false') {
      import('@/mocks/browser').then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
    }
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
    </SessionProvider>
  )
}
