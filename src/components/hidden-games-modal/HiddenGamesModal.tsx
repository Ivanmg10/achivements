'use client'

import Image from 'next/image'
import { IconEye, IconEyeOff, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import CommonModal from '@/components/common-modal/CommonModal'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import RaLogo from '@/components/ra-logo/RaLogo'

/**
 * The games hidden from the status lists, with an eye on each to show it
 * again. They come back in the list at once; a toast says how it went.
 */
export default function HiddenGamesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const { hidden, showGame } = useHiddenGames()

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="min-h-0 max-w-lg">
      <div role="dialog" aria-modal="true" aria-labelledby="hidden-games-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="hidden-games-title" className="flex items-center gap-2 text-lg font-semibold">
            <IconEyeOff size={18} className="text-text-secondary" aria-hidden="true" />
            {T.userPage.hiddenGames}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={T.userPage.close}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX size={18} aria-hidden="true" />
          </button>
        </div>

        {hidden.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">{T.userPage.hiddenEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-[60dvh] overflow-y-auto -mx-1 px-1">
            {hidden.map((g) => (
              <li key={`${g.source}:${g.id}`} className="flex items-center gap-3 rounded-xl bg-bg-main p-2 pr-1.5">
                {g.image ? (
                  <Image src={g.image} alt="" width={40} height={40} unoptimized className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" />
                )}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{g.title}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                    {g.source === 'steam' ? (
                      <SteamLogo size={11} className="text-[#66c0f4]" aria-hidden="true" />
                    ) : g.source === 'psn' ? (
                      <PlaystationLogo size={11} className="text-[#0070d1]" aria-hidden="true" />
                    ) : (
                      <RaLogo height={9} />
                    )}
                    {PLATFORM_NAME[g.source]}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => showGame(g.id, g.source)}
                  aria-label={T.userPage.showGame.replace('{title}', g.title)}
                  className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconEye size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommonModal>
  )
}
