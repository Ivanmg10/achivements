'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement } from '@/types/types'
import { notify } from '@/lib/notify'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { usePinRaAchievement } from '@/hooks/usePinRaAchievement'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { raBadgeUrl } from '@/utils/raAssets'
import { plural } from '@/utils/utils'

export function PinAchievementModal({
  isOpen,
  onClose,
  achievements,
  gameId,
  gameTitle,
  numDistinctPlayers,
  onPinned,
}: {
  isOpen: boolean
  onClose: () => void
  achievements: RetroAchievement[]
  gameId: number
  gameTitle: string
  numDistinctPlayers: number
  onPinned: () => void
}) {
  const { T, lang } = useLanguage()
  const { pin, pinningId, error, reset } = usePinRaAchievement({ gameId, gameTitle, numDistinctPlayers })

  // Opening starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (isOpen) reset()
  })

  async function handlePin(achievement: RetroAchievement) {
    if (!(await pin(achievement))) return
    onPinned()
    notify.success(T.toast.achievementsUpdated)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={T.gameExpanded.pinAchievementModalTitle} className="gap-3">
      {error && (
        <p role="alert" className="text-xs text-danger">
          {T.gameExpanded.pinError}
        </p>
      )}

      <div className="-mx-3 grid sm:grid-cols-2 gap-x-2 content-start">
        {achievements.length === 0 ? (
          <p className="col-span-full text-text-secondary text-xs text-center py-6">
            {T.gameExpanded.noUnearned}
          </p>
        ) : (
          achievements.map((a) => (
            <button
              key={a.ID}
              type="button"
              onClick={() => handlePin(a)}
              disabled={pinningId !== null}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-box transition-colors text-left hover:bg-bg-main disabled:opacity-50 focus-ring"
            >
              {a.BadgeName ? (
                <Image
                  src={raBadgeUrl(a.BadgeName)!}
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-box object-cover grayscale opacity-70 shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-9 h-9 rounded-box bg-ink/10 shrink-0" aria-hidden="true" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{a.Title}</p>
                {a.Description && <p className="text-xs text-text-secondary line-clamp-2">{a.Description}</p>}
                <p className="text-xs text-text-secondary truncate">{plural(a.Points, T.plurals.points, lang)}</p>
              </div>
              {pinningId === a.ID && <Spinner />}
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}
