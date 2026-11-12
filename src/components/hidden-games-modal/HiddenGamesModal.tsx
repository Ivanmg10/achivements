'use client'

import Image from 'next/image'
import { IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import RaLogo from '@/components/ra-logo/RaLogo'

/**
 * The games hidden from the status lists, with a small "Show" on each to show it
 * again (a word, not an eye: the eye reads as "view", #132). They come back in the list
 * at once; a toast says how it went.
 */
export default function HiddenGamesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const { hidden, showGame } = useHiddenGames()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" icon={<IconEyeOff size={20} />} title={T.userPage.hiddenGames}>
        {hidden.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">{T.userPage.hiddenEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-[60dvh] overflow-y-auto -mx-1 px-1">
            {hidden.map((g) => (
              <li key={`${g.source}:${g.id}`} className="flex items-center gap-3 rounded-tile bg-bg-main p-2 pr-1.5">
                {g.image ? (
                  <Image src={g.image} alt="" width={40} height={40} unoptimized className="w-10 h-10 rounded-box object-cover shrink-0" />
                ) : (
                  <span aria-hidden="true" className="w-10 h-10 rounded-box bg-ink/10 shrink-0" />
                )}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{g.title}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                    {g.source === 'steam' ? (
                      <SteamLogo size={11} className="text-steam" aria-hidden="true" />
                    ) : g.source === 'psn' ? (
                      <PlaystationLogo size={11} className="text-psn" aria-hidden="true" />
                    ) : g.source === 'xbox' ? (
                      <XboxLogo size={11} className="text-xbox" aria-hidden="true" />
                    ) : (
                      <RaLogo height={9} />
                    )}
                    {PLATFORM_NAME[g.source]}
                  </span>
                </span>
                <Button variant="quiet" size="sm" onClick={() => showGame(g.id, g.source)} aria-label={`${T.userPage.showAgain} ${g.title}`}>
                  {T.userPage.showAgain}
                </Button>
              </li>
            ))}
          </ul>
        )}
    </Modal>
  )
}
