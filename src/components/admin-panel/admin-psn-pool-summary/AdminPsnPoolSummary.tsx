import { formatDate } from '@/utils/dates'
import type { PsnPoolSummary } from '@/types/psnPool'
import Facts from '@/components/ui/Facts'
import Notice from '@/components/ui/Notice'

/**
 * The PSN pool at a glance (#178): how many accounts can read Sony now, how many rest or are quarantined, the last
 * hour's calls and 429s, and when to renew which, so the sign-ins never die together (about one every 12 days).
 */
export default function AdminPsnPoolSummary({ pool: p }: { pool: PsnPoolSummary }) {
  if (p.accounts === 0) {
    return <Notice tone="warning">No account yet: PSN pages answer “not configured” until one is added.</Notice>
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        <Facts
          items={[
            `${p.usable} of ${p.accounts} usable`,
            p.cooling > 0 && `${p.cooling} resting`,
            p.quarantined > 0 && `${p.quarantined} quarantined`,
            `${p.callsLastHour} calls last hour`,
            `${p.rateLimitedPct} % refused as too many`,
          ]}
        />
      </p>
      {p.suggestion && (
        <Notice tone={p.crowded.length > 0 ? 'warning' : 'info'} size="sm">
          {`Next renewal: ${p.suggestion.label} on ${formatDate(p.suggestion.at, 'en')}.`}
          {p.crowded.length > 0 && ' Some sign-ins die within 7 days of each other: renew one early to spread them out.'}
        </Notice>
      )}
    </div>
  )
}
