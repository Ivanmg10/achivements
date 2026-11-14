import { useEffect, useState } from 'react'

export type AchievementUnlock = {
  User: string
  RAPoints: number
  DateAwarded: string
  HardcoreMode: string
}

export type AchievementMeta = {
  ID: number
  Title: string
  Description: string
  Points: number
  TrueRatio: number
  Author: string
  DateCreated: string
  DateModified: string
}

export type AchievementComment = {
  User: string
  Submitted: string
  CommentText: string
}

export type AchievementDetail = {
  unlocks: {
    Achievement: AchievementMeta
    UnlocksCount: number
    TotalPlayers: number
    Unlocks: AchievementUnlock[]
  } | null
  comments: {
    Count: number
    Total: number
    Results: AchievementComment[]
  } | null
}

/** An RA achievement's extra detail (who made it, recent unlocks, comments), read when its window opens. */
export function useAchievementDetail(achievementId: number) {
  const [answer, setAnswer] = useState<{ id: number; detail: AchievementDetail | null; error: boolean } | null>(null)

  useEffect(() => {
    // Another achievement before the answer arrives must not let it land.
    let current = true
    fetch(`/api/getAchievementDetail?achievementId=${achievementId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r.json()
      })
      .then((detail: AchievementDetail) => {
        if (current) setAnswer({ id: achievementId, detail, error: false })
      })
      .catch(() => {
        if (current) setAnswer({ id: achievementId, detail: null, error: true })
      })
    return () => {
      current = false
    }
  }, [achievementId])

  // Loading is derived: until the answer is for this achievement.
  const mine = answer?.id === achievementId ? answer : null
  return { detail: mine?.detail ?? null, loading: mine === null, error: mine?.error ?? false }
}
