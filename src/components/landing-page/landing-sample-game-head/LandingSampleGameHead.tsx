'use client'

import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_GAME_PAGE } from '@/components/landing-page/landingSamples'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { steamAssetUrl } from '@/lib/steamAssets'

/**
 * The example game page's top, small: the game's wide art fading into the card, its cover, its name in the
 * display italic with its platform, and how far along it is.
 */
export default function LandingSampleGameHead() {
  const { T, lang } = useLanguage()
  const { title, source, appId, earned, total } = SAMPLE_GAME_PAGE
  const pct = Math.round((earned / total) * 100)

  return (
    <div className="relative isolate min-h-44 sm:min-h-52 flex items-end px-4 sm:px-6 pb-4 pt-16">
      <img src={steamAssetUrl(appId, 'hero')} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 w-full h-full object-cover object-[center_30%]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-bg-card/10 to-bg-card" />
      <div className="flex items-end gap-4 sm:gap-5 w-full min-w-0">
        <img
          src={steamAssetUrl(appId, 'cover')}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-16 sm:w-24 aspect-[2/3] shrink-0 object-cover rounded-box shadow-[0_10px_24px_rgb(0_0_0/0.5)]"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-display italic font-extrabold text-[1.75rem] sm:text-[2.5rem] leading-[0.95] pr-1">{title}</span>
            <LibraryPlatformBadge source={source} size="tag" />
          </span>
          <span className="flex items-center gap-3">
            <ProgressBar pct={pct} label={title} className="flex-1" />
            <span className="text-sm font-extrabold tabular-nums">{pct}%</span>
            <span className="max-sm:hidden text-[0.8125rem] text-text-secondary whitespace-nowrap">
              {T.gameInfoPage.ofAchievements.replace('{n}', earned.toLocaleString(lang)).replace('{total}', total.toLocaleString(lang))}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
