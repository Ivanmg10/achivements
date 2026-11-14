'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import { candidateToGroupItemBody, type GameCandidate } from '@/utils/gameCandidates'
import { plural } from '@/utils/utils'
import GamePicker from '@/components/game-picker/GamePicker'
import { notify } from '@/lib/notify'

async function addToGroup(groupId: number, c: GameCandidate): Promise<GameGroupItem | null> {
  try {
    const res = await fetch(`/api/groups/${groupId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateToGroupItemBody(c)),
    })
    if (!res.ok) {
      console.error('[AddGameModal] add failed', res.status, c.key)
      return null
    }
    return (await res.json()) as GameGroupItem
  } catch (err) {
    console.error('[AddGameModal] add failed', err)
    return null
  }
}

/**
 * Add games to a group, every platform alike: the game picker with the group's way of saving.
 * `existingKeys` are the group's games as gameKey()s, so they are not offered.
 */
export default function AddGameModal({
  isOpen,
  onClose,
  groupId,
  groupTitle,
  existingKeys,
  onAdded,
}: {
  isOpen: boolean
  onClose: () => void
  groupId: number
  groupTitle?: string
  existingKeys: Set<string>
  onAdded: (items: GameGroupItem[]) => void
}) {
  const { T, lang } = useLanguage()

  /** Adds what it can; resolves with the games that failed, to be retried. */
  async function handleConfirm(picked: GameCandidate[]): Promise<GameCandidate[]> {
    const added: GameGroupItem[] = []
    const failed: GameCandidate[] = []
    for (const c of picked) {
      const item = await addToGroup(groupId, c)
      if (item) added.push(item)
      else failed.push(c)
    }
    if (added.length) onAdded(added)
    if (!failed.length) notify.success(T.toast.gamesAdded)
    return failed
  }

  return (
    <GamePicker
      isOpen={isOpen}
      onClose={onClose}
      title={T.groups.addGames}
      hint={groupTitle ? T.groups.addTo.replace('{group}', groupTitle) : undefined}
      searchLabel={T.groups.searchGames}
      excludeKeys={existingKeys}
      onConfirm={handleConfirm}
      confirmLabel={(n) => (n > 0 ? T.groups.addSelected.replace('{games}', plural(n, T.plurals.games, lang)) : T.groups.addGames)}
      pickPrompt={T.groups.pickToAdd}
      errorText={T.groups.addError}
    />
  )
}
