'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import GamePicker from '@/components/game-picker/GamePicker'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { PLATFORM_NAME, gameKey } from '@/utils/gameRef'
import { candidateIconUrl, type GameCandidate } from '@/utils/gameCandidates'
import { plural } from '@/utils/utils'
import RaLogo from '@/components/ra-logo/RaLogo'

/**
 * The games hidden from the status lists, with a small "Show" on each to show it
 * again (a word, not an eye: the eye reads as "view", #132). They come back in the list
 * at once; a toast says how it went. "Hide games" opens the game picker to hide several more in one go.
 */
export default function HiddenGamesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T, lang } = useLanguage()
  const { hidden, showGame, hideGames } = useHiddenGames()
  const [picking, setPicking] = useState(false)
  const hiddenKeys = useMemo(() => new Set(hidden.map((g) => gameKey(g.source, g.id))), [hidden])

  /** Hides what it can; resolves with the games that failed, to be retried in the picker. */
  async function hidePicked(picked: GameCandidate[]): Promise<GameCandidate[]> {
    const failed = await hideGames(picked.map((c) => ({ source: c.source, id: c.id, title: c.title, image: candidateIconUrl(c) || null })))
    return picked.filter((c) => failed.some((f) => f.source === c.source && f.id === c.id))
  }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<IconEyeOff size={20} />}
      title={T.userPage.hiddenGames}
      footer={
        <Button variant="secondary" onClick={() => setPicking(true)} aria-haspopup="dialog">
          {T.userPage.hideGamesButton}
        </Button>
      }
    >
        {hidden.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">{T.userPage.hiddenEmpty}</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-1.5">
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
    <GamePicker
      isOpen={picking}
      onClose={() => setPicking(false)}
      title={T.userPage.hideGamesButton}
      hint={T.userPage.hidePickerHint}
      searchLabel={T.groups.searchGames}
      excludeKeys={hiddenKeys}
      onConfirm={hidePicked}
      confirmLabel={(n) => (n > 0 ? T.userPage.hideSelected.replace('{games}', plural(n, T.plurals.games, lang)) : T.userPage.hideGamesButton)}
      pickPrompt={T.userPage.pickToHide}
      errorText={T.userPage.hideError}
    />
    </>
  )
}
