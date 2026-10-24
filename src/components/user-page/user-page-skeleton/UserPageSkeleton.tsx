'use client'

import { useLanguage } from '@/context/LanguageContext'

const BLOCK = 'bg-ink/[0.08]'

/** The account page while it loads, in its own layout: identity and preferences, platforms, delete. Announced once. */
export default function UserPageSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="min-h-screen bg-bg-main text-text-main flex flex-col items-center py-6 px-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="w-full lg:max-w-[95%] flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
          {/* Identity: avatar, name and id, the action buttons */}
          <div className="bg-bg-card rounded-3xl px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className={`${BLOCK} rounded-full w-24 h-24 sm:w-28 sm:h-28 shrink-0`} />
              <div className="flex flex-col gap-2">
                <div className={`${BLOCK} h-8 w-44 rounded-lg`} />
                <div className={`${BLOCK} h-3 w-20 rounded`} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className={`${BLOCK} h-8 w-24 rounded-xl`} />
              <div className={`${BLOCK} h-8 w-24 rounded-xl`} />
            </div>
          </div>
          {/* Preferences: theme, language, favourite games */}
          <div className="bg-bg-card rounded-3xl p-6 flex flex-col gap-5">
            <div className={`${BLOCK} h-3.5 w-28 rounded`} />
            <div className="bg-bg-main rounded-2xl p-4 flex flex-col gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className={`${BLOCK} h-4 w-1/3 rounded`} />
                  <div className={`${BLOCK} h-4 w-1/4 rounded`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platforms: RetroAchievements, Steam, PlayStation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-bg-card rounded-3xl p-5 flex items-center gap-3">
              <div className={`${BLOCK} w-11 h-11 rounded-lg shrink-0`} />
              <div className="flex flex-col gap-2 flex-1">
                <div className={`${BLOCK} h-4 w-1/2 rounded`} />
                <div className={`${BLOCK} h-3 w-3/4 rounded`} />
              </div>
            </div>
          ))}
        </div>

        {/* Delete account */}
        <div className="bg-bg-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 border border-danger/20">
          <div className="flex-1 flex flex-col gap-2">
            <div className={`${BLOCK} h-3.5 w-36 rounded`} />
            <div className={`${BLOCK} h-3 w-2/3 rounded`} />
          </div>
          <div className={`${BLOCK} h-9 w-32 rounded-xl`} />
        </div>
      </div>
    </div>
  )
}
