'use client'

import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { SessionProvider } from 'next-auth/react'
import ShapeSync from '@/components/shape-sync/ShapeSync'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <ShapeSync />
          {children}
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
