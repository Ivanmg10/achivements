'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { GameComment } from '@/app/api/getGameComments/route'
import Image from 'next/image'
import Link from 'next/link'
import { IconChevronUp } from '@tabler/icons-react'
import { SURFACE } from '@/components/ui/surface'
import { buttonClass } from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import { useWhenChanged } from '@/hooks/useWhenChanged'

const PREVIEW_COUNT = 2

export default function GameInfoComments({ gameId }: { gameId: number }) {
  const { T } = useLanguage()
  const [comments, setComments] = useState<GameComment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(true)

  // Another game starts the load over; state, so while rendering. The fetch is the effect.
  useWhenChanged([gameId], () => {
    setLoading(true)
    setError(false)
  })

  useEffect(() => {
    // An answer for the previous game must not land on this one.
    let current = true
    fetch(`/api/getGameComments?gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        if (!current) return
        const results: GameComment[] = data.Results ?? []
        setComments([...results].reverse())
        setTotal(data.Total ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (!current) return
        setError(true)
        setLoading(false)
      })
    return () => {
      current = false
    }
  }, [gameId])

  const shell = `${SURFACE} p-5 sm:p-6 flex flex-col gap-3.5`

  if (loading) {
    return (
      <Wrap>
        <section className={shell}>
          <p className="text-sm text-text-secondary animate-pulse">{T.gameComments.loading}</p>
        </section>
      </Wrap>
    )
  }

  if (error) {
    return (
      <Wrap>
        <section className={shell}>
          <p className="text-sm text-danger" role="alert">{T.gameComments.error}</p>
        </section>
      </Wrap>
    )
  }

  if (comments.length === 0) return null

  const visible = expanded ? comments : comments.slice(0, PREVIEW_COUNT)

  return (
    <Wrap>
      <section aria-labelledby="game-comments-title" className={shell}>
        <div className="flex items-center gap-2.5">
          <h2 id="game-comments-title" className="text-xl font-bold">{T.gameComments.title}</h2>
          <span className="inline-flex items-center h-6 px-2 rounded-[0.375rem] text-xs font-bold tabular-nums bg-ink/[0.07] text-text-secondary">{total}</span>
          <IconButton
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="game-comments-list"
            aria-label={open ? T.gameComments.fold : T.gameComments.unfold}
            size="sm"
            className="ml-auto"
          >
            <IconChevronUp className={`w-4 h-4 transition-transform duration-(--motion-hover) ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
          </IconButton>
        </div>

        {open && (
          <>
            <div id="game-comments-list" className="flex flex-col">
              {visible.map((c, i) => (
                <CommentRow key={i} comment={c} last={i === visible.length - 1} />
              ))}
            </div>

            {comments.length > PREVIEW_COUNT && (
              <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className={buttonClass('secondary', 'md', 'self-start')}>
                {expanded ? T.gameComments.collapse : T.gameComments.showAll.replace('{n}', String(comments.length))}
              </button>
            )}
          </>
        )}
      </section>
    </Wrap>
  )
}

/** The page's side margins, as the achievements' card above. */
function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-4 sm:px-8 lg:px-14 mb-10">{children}</div>
}

function CommentRow({ comment, last }: { comment: GameComment; last: boolean }) {
  const date = new Date(comment.Submitted).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={`flex items-start gap-3 py-3 ${last ? '' : 'shadow-[inset_0_-1px_0_rgb(var(--ink)/0.06)]'}`}>
      <Link
        href={`https://retroachievements.org/user/${encodeURIComponent(comment.User)}`}
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
          className="w-[2.125rem] h-[2.125rem] rounded-full object-cover bg-ink/10"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`https://retroachievements.org/user/${encodeURIComponent(comment.User)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold hover:underline"
          >
            {comment.User}
          </Link>
          <span className="text-[0.8125rem] text-text-secondary">· {date}</span>
        </div>
        <p className="text-sm leading-normal mt-0.5 wrap-break-word">{comment.CommentText}</p>
      </div>
    </div>
  )
}
