'use client'

import { IconHash } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameHashes } from '@/hooks/useGameHashes'
import Modal from '@/components/ui/Modal'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { Skeleton } from '@/components/ui/Skeleton'
import { plural } from '@/utils/utils'
import GameHashesModalCard from './game-hashes-modal-card/GameHashesModalCard'

type Props = {
  isOpen: boolean
  onClose: () => void
  gameId: number
  gameTitle: string
}

export default function GameHashesModal({ isOpen, onClose, gameId, gameTitle }: Props) {
  const { T, lang } = useLanguage()
  const { hashes, isLoading, error, retry } = useGameHashes(gameId, isOpen)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" icon={<IconHash size={20} />} title={T.gameInfoPage.hashesCompatible} hint={gameTitle}>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-bg-main rounded-tile p-4 flex flex-col gap-2">
              <Skeleton className="h-3 w-48 max-w-full" />
              <Skeleton className="h-2.5 w-64 max-w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorRetry message={T.gameInfoPage.hashesLoadError} retryLabel={T.gameInfoPage.retry} onRetry={retry} />
      ) : hashes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <IconHash className="w-8 h-8 text-text-secondary opacity-30" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{T.gameInfoPage.hashesNone}</p>
          <p className="text-xs text-text-secondary">{T.gameInfoPage.hashesNoneHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-text-secondary">{plural(hashes.length, T.plurals.hashes, lang)}</p>
          {hashes.map((h) => (
            <GameHashesModalCard key={h.MD5} hash={h} />
          ))}
        </div>
      )}
    </Modal>
  )
}
