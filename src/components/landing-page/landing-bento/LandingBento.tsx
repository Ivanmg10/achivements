'use client'

import { IconChartHistogram, IconLayoutGrid, IconLibrary } from '@tabler/icons-react'
import LandingFeature from '@/components/landing-page/landing-feature/LandingFeature'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { steamAssetUrl } from '@/lib/steamClient'

/** A handful of the collage's own art, both platforms, fanned out in the big tile. */
const COVERS = [
  'https://media.retroachievements.org/Images/068145.png',
  steamAssetUrl(1817070, 'cover'),
  'https://media.retroachievements.org/Images/081263.png',
  steamAssetUrl(374320, 'cover'),
  'https://media.retroachievements.org/Images/114344.png',
]
const FAN = [-14, -7, 0, 7, 14]

/**
 * What you get, as one big tile and two small ones rather than three equal
 * cards: the library leads, with real covers from both platforms and the
 * platforms named, PlayStation as still coming.
 */
export default function LandingBento() {
  const { T } = useLanguage()

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20 grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
      <LandingFeature
        icon={<IconLibrary size={22} />}
        title={T.landing.libraryTitle}
        text={T.landing.libraryText}
        className="md:col-span-2 md:row-span-2"
      >
        <div aria-hidden="true" className="relative h-44 sm:h-56 mt-4 flex items-end justify-center [--fan:4px] sm:[--fan:9px]">
          {COVERS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute bottom-0 w-24 h-32 sm:w-32 sm:h-44 object-cover rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50 transition-transform duration-500"
              style={{
                transform: `translateX(calc(var(--fan) * ${FAN[i]})) rotate(${FAN[i]}deg) translateY(${Math.abs(FAN[i]) * 0.8}px)`,
                zIndex: 10 - Math.abs(FAN[i]),
              }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-white/5 text-sm text-text-secondary">
          <li className="text-xs uppercase tracking-widest text-text-secondary/60">{T.landing.platformsLead}</li>
          <li className="flex items-center gap-2">
            <RaLogo height={14} />
            RetroAchievements
          </li>
          <li className="flex items-center gap-2">
            <SteamLogo size={15} className="text-[#66c0f4]" aria-hidden="true" />
            Steam
          </li>
          <li className="flex items-center gap-2 text-text-secondary/60">
            <PlaystationLogo size={15} aria-hidden="true" />
            {T.landing.psnSoon}
          </li>
        </ul>
      </LandingFeature>

      <LandingFeature icon={<IconLayoutGrid size={22} />} title={T.landing.organiseTitle} text={T.landing.organiseText} />
      <LandingFeature icon={<IconChartHistogram size={22} />} title={T.landing.progressTitle} text={T.landing.progressText} />
    </section>
  )
}
