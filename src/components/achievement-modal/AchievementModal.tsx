'use client'

import { RetroAchievement } from '@/types/types'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface AchievementUnlock {
  User: string
  RAPoints: number
  DateAwarded: string
  HardcoreMode: string
}

interface AchievementMeta {
  ID: number
  Title: string
  Description: string
  Points: number
  TrueRatio: number
  Author: string
  DateCreated: string
  DateModified: string
}

interface Comment {
  User: string
  Submitted: string
  CommentText: string
}

interface AchievementDetail {
  unlocks: {
    Achievement: AchievementMeta
    UnlocksCount: number
    TotalPlayers: number
    Unlocks: AchievementUnlock[]
  } | null
  comments: {
    Count: number
    Total: number
    Results: Comment[]
  } | null
}

export default function AchievementModal({
  achievement,
  numDistinctPlayers,
  onClose,
}: {
  achievement: RetroAchievement
  numDistinctPlayers: number
  onClose: () => void
}) {
  const { T } = useLanguage()
  const [detail, setDetail] = useState<AchievementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlocksOpen, setUnlocksOpen] = useState(false)
  const [commentsPage, setCommentsPage] = useState(0)

  const COMMENTS_PER_PAGE = 50

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-blue-900/60 text-blue-300' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-yellow-900/60 text-yellow-300' },
    missable: { label: T.achievement.missable, className: 'bg-red-900/60 text-red-300' },
  }

  const typeBadge = achievement.Type ? TYPE_BADGES[achievement.Type] : null
  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const rarityPct = numDistinctPlayers > 0
    ? ((achievement.NumAwarded / numDistinctPlayers) * 100).toFixed(1)
    : null

  useEffect(() => {
    fetch(`/api/getAchievementDetail?achievementId=${achievement.ID}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r.json()
      })
      .then(setDetail)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [achievement.ID])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const earnedDate = achievement.DateEarned
    ? new Date(achievement.DateEarned).toLocaleString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-main rounded-2xl w-full max-w-4xl max-h-[65vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-bg-header">
          {achievement.BadgeName && (
            <Image
              src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
              alt={achievement.Title}
              width={80}
              height={80}
              className={`w-20 h-20 rounded-xl object-cover shrink-0 ${
                earnedHardcore ? 'ring-2 ring-yellow-400' : earned ? 'ring-2 ring-blue-500/50' : 'grayscale opacity-50'
              }`}
            />
          )}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{achievement.Title}</h2>
              {typeBadge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
                  {typeBadge.label}
                </span>
              )}
              {earnedHardcore && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">HC</span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{achievement.Description}</p>
            {earnedDate && (
              <p className="text-xs text-text-secondary/60 mt-1">{T.achievement.earnedOn} {earnedDate}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors text-xl shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Stats + Meta 3x3 grid */}
        <div className="grid grid-cols-3 divide-x divide-bg-header border-b border-bg-header">
          <div className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-lg font-semibold tabular-nums">{achievement.Points}</p>
            <p className="text-xs text-text-secondary">pts</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-lg font-semibold tabular-nums">{achievement.NumAwarded.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">{T.achievement.players}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <p className="text-lg font-semibold tabular-nums">{rarityPct ?? '—'}<span className="text-sm">%</span></p>
            <p className="text-xs text-text-secondary">rarity</p>
          </div>
          {detail?.unlocks?.Achievement && <>
            <div className="flex flex-col items-center gap-0.5 py-4 px-2 border-t border-bg-header">
              <p className="text-sm font-semibold text-center truncate w-full">{detail.unlocks.Achievement.Author}</p>
              <p className="text-xs text-text-secondary">author</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-4 px-2 border-t border-bg-header">
              <p className="text-lg font-semibold tabular-nums">{detail.unlocks.Achievement.TrueRatio}</p>
              <p className="text-xs text-text-secondary">true ratio</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-4 px-2 border-t border-bg-header">
              <p className="text-sm font-semibold tabular-nums">{new Date(detail.unlocks.Achievement.DateCreated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="text-xs text-text-secondary">created</p>
            </div>
          </>}
        </div>

        <div className="flex flex-col gap-6 p-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-text-secondary/30 border-t-text-main rounded-full animate-spin" />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          {!loading && detail && (() => {
            const sortedComments = detail.comments?.Results
              ? [...detail.comments.Results].sort(
                  (a, b) => new Date(b.Submitted).getTime() - new Date(a.Submitted).getTime()
                )
              : []
            const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE)
            const pageComments = sortedComments.slice(
              commentsPage * COMMENTS_PER_PAGE,
              (commentsPage + 1) * COMMENTS_PER_PAGE,
            )

            return (
              <>
                {/* Recent unlocks — collapsible */}
                {detail.unlocks?.Unlocks && detail.unlocks.Unlocks.length > 0 && (
                  <div className="flex flex-col gap-0 border border-bg-header rounded-xl overflow-hidden">
                    <button
                      onClick={() => setUnlocksOpen((o) => !o)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-bg-header/40 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        Recent unlocks ({detail.unlocks.UnlocksCount.toLocaleString()} / {detail.unlocks.TotalPlayers.toLocaleString()})
                      </span>
                      <span className="text-text-secondary text-xs">{unlocksOpen ? '▲' : '▼'}</span>
                    </button>
                    {unlocksOpen && (
                      <div className="flex flex-col gap-2 p-4 border-t border-bg-header">
                        {detail.unlocks.Unlocks.map((u, i) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Image
                                src={`https://media.retroachievements.org/UserPic/${u.User}.png`}
                                alt={u.User}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <p className="text-sm">{u.User}</p>
                              {u.HardcoreMode === '1' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">HC</span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary/60 tabular-nums">
                              {new Date(u.DateAwarded).toLocaleDateString(undefined, {
                                day: '2-digit', month: 'short', year: '2-digit',
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                {sortedComments.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        Comments ({detail.comments!.Total})
                      </h3>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCommentsPage((p) => Math.max(0, p - 1))}
                            disabled={commentsPage === 0}
                            className="px-2 py-0.5 text-xs rounded bg-bg-card disabled:opacity-30 hover:bg-bg-header transition-colors"
                          >
                            ←
                          </button>
                          <span className="text-xs text-text-secondary tabular-nums">
                            {commentsPage + 1} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCommentsPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={commentsPage === totalPages - 1}
                            className="px-2 py-0.5 text-xs rounded bg-bg-card disabled:opacity-30 hover:bg-bg-header transition-colors"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {pageComments.map((c, i) => (
                        <div key={i} className="flex gap-3">
                          <Image
                            src={`https://media.retroachievements.org/UserPic/${c.User}.png`}
                            alt={c.User}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <p className="text-sm font-medium">{c.User}</p>
                              <p className="text-xs text-text-secondary/60">
                                {new Date(c.Submitted).toLocaleDateString(undefined, {
                                  day: '2-digit', month: 'short', year: '2-digit',
                                })}
                              </p>
                            </div>
                            <p className="text-sm text-text-secondary wrap-break-word">{c.CommentText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary/50 text-center py-2">No comments yet</p>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
