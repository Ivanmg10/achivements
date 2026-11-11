'use client'

import Button from '@/components/ui/Button'

/**
 * A game page whose platform library could not be read: not "game not found" (the game may well be
 * there), but why, and a way to ask again.
 */
export default function GamePageLibraryError({
  title,
  reason,
  retryLabel,
  onRetry,
}: {
  title: string
  reason: string
  retryLabel: string
  onRetry: () => void
}) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-text-main gap-3 p-6 text-center">
      <p role="alert" className="text-danger text-lg">{title}</p>
      <p className="text-sm text-text-secondary">{reason}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  )
}
