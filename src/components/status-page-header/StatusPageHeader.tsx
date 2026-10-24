'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'

const CATEGORY_STYLES: Record<string, string> = {
  playing:    'bg-blue-900/50 text-blue-300',
  wantToPlay: 'bg-purple-900/50 text-purple-300',
  completed:  'bg-green-900/50 text-success',
}

export default function StatusPageHeader({
  consoleName,
  category,
  gameCount,
  children,
}: {
  consoleName?: string
  category: string
  gameCount: number
  /** Beside the title: a control that belongs to it, such as which platform to show. */
  children?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const CATEGORY_LABELS: Record<string, string> = {
    playing:    T.mainPage.playing,
    wantToPlay: T.mainPage.wantToPlay,
    completed:  T.mainPage.completed,
  }

  const label = CATEGORY_LABELS[category] ?? category
  const style = CATEGORY_STYLES[category] ?? 'bg-bg-card text-text-secondary'

  return (
    <div className="flex flex-col gap-1 pb-5 border-b border-bg-card mb-1 min-w-0 max-w-full">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] pr-1">{consoleName ?? label}</h1>
        {consoleName && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style}`}>{label}</span>
        )}
        {children}
      </div>
      <p className="text-sm text-text-secondary">{plural(gameCount, T.plurals.games, lang)}</p>
    </div>
  )
}
