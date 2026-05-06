'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'

export default function LoadingPage({ subtitle }: { subtitle?: string }) {
  const { T } = useLanguage()

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-center items-center bg-bg-main select-none">
      <div className="flex flex-col items-center gap-6">
        <p className="font-mono text-sm text-text-secondary uppercase tracking-[0.18em]">
          {subtitle ?? T.loadingPage.title}
        </p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
