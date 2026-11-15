'use client'

import { daysUntil } from '@/utils/psnPool'
import { formatDate, formatDateTime } from '@/utils/dates'
import type { PsnAccountInfo, PsnAccountStatus } from '@/types/psnPool'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import Button from '@/components/ui/Button'
import Facts from '@/components/ui/Facts'
import Tag, { type TagTone } from '@/components/ui/Tag'
import { SURFACE } from '@/components/ui/surface'

/** Admin panel text is English (exempt from i18n). */
const STATUS: Record<PsnAccountStatus, { label: string; tone: TagTone }> = {
  active: { label: 'Active', tone: 'success' },
  paused: { label: 'Paused', tone: 'muted' },
  draining: { label: 'Draining', tone: 'info' },
  quarantined: { label: 'Quarantined', tone: 'danger' },
}

export type PsnRowAction = 'renew' | 'test' | 'pause' | 'resume' | 'drain' | 'remove'

function expiry(a: PsnAccountInfo, now: number) {
  const left = daysUntil(a.npssoExpiresAt, now)
  if (left === null) return <span className="text-text-secondary">Expiry unknown</span>
  const tone = left <= 0 ? 'text-danger' : left <= 7 ? 'text-warning' : 'text-success'
  return (
    <span>
      <span className={`font-semibold ${tone}`}>{left <= 0 ? 'Expired' : `${left} days left`}</span>
      <span className="text-text-secondary">{` until ${formatDate(a.npssoExpiresAt, 'en')}`}</span>
    </span>
  )
}

function canary(a: PsnAccountInfo) {
  if (a.canaryAt === null) return 'No canary yet'
  return `${a.canaryOk ? 'Canary ok' : 'Canary failed'} ${formatDateTime(a.canaryAt, 'en')}`
}

/**
 * One PSN service account (#178): its label, state and who it signs in as (read from Sony with its own token);
 * how long its NPSSO has left and until when, when and by whom it was last renewed, its weight, its calls in the
 * last hour and the canary's last answer; and what can be done with it. A sign-in that dies within 7 days of
 * another's is marked, so the renewals are spread out.
 */
export default function AdminPsnAccountRow({
  account: a,
  crowded,
  busy,
  onAction,
  now,
}: {
  account: PsnAccountInfo
  /** Its sign-in dies within 7 days of another account's. */
  crowded: boolean
  /** An action on it is running. */
  busy: boolean
  onAction: (action: PsnRowAction) => void
  /** What days left and cooldowns are counted from: when the list was read. */
  now: number
}) {
  const status = STATUS[a.status]
  const resting = a.status === 'active' && a.cooldownUntil !== null && a.cooldownUntil > now

  return (
    <li className={`${SURFACE} p-4 flex flex-col gap-3`}>
      <div className="flex items-start gap-3 flex-wrap">
        <span aria-hidden="true" className="size-10 shrink-0 rounded-box bg-psn/10 flex items-center justify-center">
          <PlaystationLogo size={18} className="text-psn" />
        </span>
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{a.label}</span>
            <Tag tone={status.tone} size="sm">{status.label}</Tag>
            {resting && <Tag tone="warning" size="sm">Resting after 429s</Tag>}
            {crowded && <Tag tone="warning" size="sm">Expires near another</Tag>}
            <span className="text-sm text-text-secondary truncate">{a.onlineId ? `signs in as ${a.onlineId}` : 'online ID not read yet'}</span>
          </div>
          {a.hint && <span className="text-xs text-text-secondary">{a.hint}</span>}
          <span className="text-sm">
            <Facts
              items={[
                expiry(a, now),
                a.renewedAt !== null && `renewed ${formatDate(a.renewedAt, 'en')}${a.renewedBy ? ` by ${a.renewedBy}` : ''}`,
                `weight ${a.weight}`,
                `${a.callsLastHour} calls last hour`,
                canary(a),
              ]}
            />
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('renew')}>Renew</Button>
        <Button size="sm" variant="quiet" disabled={busy} onClick={() => onAction('test')}>Test</Button>
        {a.status === 'active' && <Button size="sm" variant="quiet" disabled={busy} onClick={() => onAction('drain')}>Drain</Button>}
        {a.status === 'active' ? (
          <Button size="sm" variant="quiet" disabled={busy} onClick={() => onAction('pause')}>Pause</Button>
        ) : (
          <Button size="sm" variant="quiet" disabled={busy} onClick={() => onAction('resume')}>Resume</Button>
        )}
        <Button size="sm" variant="danger" disabled={busy} onClick={() => onAction('remove')}>Remove</Button>
      </div>
    </li>
  )
}
