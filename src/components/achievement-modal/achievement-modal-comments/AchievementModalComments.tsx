'use client'

import { useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { AchievementComment } from '@/hooks/useAchievementDetail'
import { formatDate, parseUnlockTime } from '@/utils/dates'
import { raAvatarUrl } from '@/utils/raAssets'
import Avatar from '@/components/ui/Avatar'
import IconButton from '@/components/ui/IconButton'
import ShowMore from '@/components/ui/ShowMore'

/** How many comments show before "See all". */
export const COMMENTS_SHOWN = 4
const COMMENTS_PER_PAGE = 50

/**
 * An RA achievement's comments, newest first: the last few, then `ShowMore` for the rest (which come 50 to a page,
 * with the arrows, as before).
 */
export default function AchievementModalComments({ comments, total }: { comments: AchievementComment[]; total: number }) {
  const { T, lang } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => [...comments].sort((a, b) => parseUnlockTime(b.Submitted) - parseUnlockTime(a.Submitted)), [comments])
  if (sorted.length === 0) return <p className="text-sm text-text-secondary text-center py-2">{T.achievement.noComments}</p>

  const pages = Math.ceil(sorted.length / COMMENTS_PER_PAGE)
  const shown = expanded ? sorted.slice(page * COMMENTS_PER_PAGE, (page + 1) * COMMENTS_PER_PAGE) : sorted.slice(0, COMMENTS_SHOWN)

  return (
    <section aria-labelledby="achievement-comments-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 id="achievement-comments-title" className="text-sm font-semibold text-text-secondary">
          {T.achievement.comments} ({total.toLocaleString(lang)})
        </h3>
        {expanded && pages > 1 && (
          <div className="flex items-center gap-2">
            <IconButton size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label={T.achievement.previousComments}>
              <IconChevronLeft size={16} aria-hidden="true" />
            </IconButton>
            <span className="text-xs text-text-secondary tabular-nums">
              {page + 1} / {pages}
            </span>
            <IconButton size="sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} aria-label={T.achievement.nextComments}>
              <IconChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-4">
        {shown.map((c, i) => (
          <li key={`${page}-${i}`} className="flex gap-3">
            {c.User ? <Avatar src={raAvatarUrl(c.User)} name={c.User} size={32} /> : <span aria-hidden="true" className="w-8 h-8 rounded-full bg-ink/10 shrink-0" />}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium">{c.User}</p>
                <p className="text-xs text-text-secondary">{formatDate(c.Submitted, lang)}</p>
              </div>
              <p className="text-sm text-text-secondary wrap-break-word">{c.CommentText}</p>
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > COMMENTS_SHOWN && (
        <ShowMore
          expanded={expanded}
          onToggle={() => {
            setExpanded((e) => !e)
            setPage(0)
          }}
          more={T.gameComments.showAll.replace('{n}', String(sorted.length))}
          less={T.gameComments.showLatest.replace('{n}', String(COMMENTS_SHOWN))}
          size="sm"
          className="self-center"
        />
      )}
    </section>
  )
}
