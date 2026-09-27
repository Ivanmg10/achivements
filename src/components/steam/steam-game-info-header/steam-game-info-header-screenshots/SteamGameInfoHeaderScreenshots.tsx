import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

const SHOWN = 2

/**
 * Two store screenshots beside a Steam game's header, where the RA page shows
 * its title screen and in-game shot. Each opens the full-size image.
 */
export default function SteamGameInfoHeaderScreenshots({
  screenshots,
  title,
}: {
  screenshots: { thumb: string; full: string }[]
  title: string
}) {
  const { T } = useLanguage()
  const shown = screenshots.slice(0, SHOWN)
  if (shown.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-2 w-full max-w-sm lg:max-w-none">
      {shown.map((s, i) => (
        <li key={s.full}>
          <a
            href={s.full}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden hover:ring-2 hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] transition-shadow"
          >
            <Image
              src={s.thumb}
              alt={`${title} — ${T.steam.screenshot} ${i + 1}`}
              width={300}
              height={169}
              className="w-full object-cover aspect-video"
              unoptimized
            />
          </a>
        </li>
      ))}
    </ul>
  )
}
