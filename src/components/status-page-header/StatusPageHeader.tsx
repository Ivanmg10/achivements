'use client'

import { useLanguage } from '@/context/LanguageContext'

const CATEGORY_STYLES: Record<string, string> = {
  playing:    'bg-blue-900/50 text-blue-300',
  wantToPlay: 'bg-purple-900/50 text-purple-300',
  completed:  'bg-green-900/50 text-green-300',
}

export default function StatusPageHeader({
  consoleName,
  category,
  gameCount,
}: {
  consoleName?: string
  category: string
  gameCount: number
}) {
  const { T } = useLanguage()

  const CATEGORY_LABELS: Record<string, string> = {
    playing:    T.mainPage.playing,
    wantToPlay: T.mainPage.wantToPlay,
    completed:  T.mainPage.completed,
  }

  const label = CATEGORY_LABELS[category] ?? category
  const style = CATEGORY_STYLES[category] ?? 'bg-bg-card text-text-secondary'

  return (
    <div className="flex flex-col gap-1 pb-5 border-b border-bg-card mb-1">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{consoleName ?? label}</h1>
        {consoleName && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style}`}>{label}</span>
        )}
      </div>
      <p className="text-sm text-text-secondary/60">{gameCount} {gameCount === 1 ? 'game' : 'games'}</p>
    </div>
  )
}
