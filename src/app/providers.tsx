'use client'

import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
