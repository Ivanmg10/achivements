'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { GameComment } from '@/app/api/getGameComments/route'
import Image from 'next/image'
import { IconMessageCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

const PREVIEW_COUNT = 5

export default function GameInfoComments({ gameId }: { gameId: number }) {
  const { T } = useLanguage()
  const [comments, setComments] = useState<GameComment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/getGameComments?gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        const results: GameComment[] = data.Results ?? []
        setComments([...results].reverse())
        setTotal(data.Total ?? 0)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [gameId])

  if (loading) {
    return (
      <section className="bg-bg-card p-5 rounded-xl w-[95%] mb-5">
        <p className="text-sm text-text-secondary animate-pulse">{T.gameComments.loading}</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="bg-bg-card p-5 rounded-xl w-[95%] mb-5">
        <p className="text-sm text-red-400" role="alert">{T.gameComments.error}</p>
      </section>
    )
  }

  if (comments.length === 0) return null

  const visible = expanded ? comments : comments.slice(0, PREVIEW_COUNT)

  return (
    <section className="bg-bg-card p-5 rounded-xl w-[95%] mb-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconMessageCircle className="w-4 h-4 text-text-secondary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          {T.gameComments.title}
          <span className="ml-2 text-text-secondary/60 font-normal normal-case">({total})</span>
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((c, i) => (
          <CommentRow key={i} comment={c} />
        ))}
      </div>

      {comments.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-main transition-colors self-start"
        >
          {expanded ? (
            <>
              <IconChevronUp className="w-3.5 h-3.5" />
              {T.gameComments.collapse}
            </>
          ) : (
            <>
              <IconChevronDown className="w-3.5 h-3.5" />
              {T.gameComments.showMore} ({comments.length - PREVIEW_COUNT})
            </>
          )}
        </button>
      )}
    </section>
  )
}

function CommentRow({ comment }: { comment: GameComment }) {
  const date = new Date(comment.Submitted).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="flex items-start gap-3">
      <a
        href={`https://retroachievements.org/user/${comment.User}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={`https://media.retroachievements.org/UserPic/${comment.User}.png`}
          alt={comment.User}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover bg-bg-header"
        />
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <a
            href={`https://retroachievements.org/user/${comment.User}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
          >
            {comment.User}
          </a>
          <span className="text-xs text-text-secondary/60">{date}</span>
        </div>
        <p className="text-sm text-text-secondary mt-0.5 wrap-break-word">{comment.CommentText}</p>
      </div>
    </div>
  )
}
