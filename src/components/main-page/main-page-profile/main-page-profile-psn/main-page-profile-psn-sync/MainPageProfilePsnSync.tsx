'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSecondsLeft } from '@/hooks/useSecondsLeft'
import type { PsnSyncState } from '@/lib/psnSnapshot'
import { relativeTime } from '@/utils/dates'
import { countdown, psnSyncEta, psnSyncMessage } from '@/utils/psnSyncCopy'
import Facts from '@/components/ui/Facts'
import { pillClass } from '@/components/ui/Pill'
import { ProgressBar } from '@/components/ui/ProgressBar'
import MainPageProfilePsnSyncSteps from './main-page-profile-psn-sync-steps/MainPageProfilePsnSyncSteps'

/**
 * Where the PSN sync stands, in the profile card (#180, docs/psn-multi-account-pool.md §9): when Sony was last
 * read and when the refresh button may read it again (a countdown), one line in plain words (a live region), and
 * while a sync runs its four steps, a real progress bar and a rounded wait. On a phone the steps fold behind a
 * chip, so the card is not pushed down. Someone else's page shows only the first line (`sync` is null there).
 */
export default function MainPageProfilePsnSync({ sync, syncedAt, nextSyncAt }: { sync: PsnSyncState | null; syncedAt?: number | null; nextSyncAt?: number | null }) {
  const { T, lang } = useLanguage()
  const copy = T.psn.sync
  const [open, setOpen] = useState(false)
  const at = sync?.syncedAt ?? syncedAt ?? null
  const secondsLeft = useSecondsLeft(sync ? sync.nextSyncAt : nextSyncAt)
  const message = sync && psnSyncMessage(sync, copy, lang)
  const running = sync !== null && sync.stage !== 'ready' && sync.stage !== 'private' && sync.trouble !== 'paused'
  const eta = running ? psnSyncEta(sync.etaSeconds, copy, lang) : null
  const pct = `${sync?.progress ?? 0}`

  return (
    <div className="flex flex-col gap-2 text-[0.8125rem] text-text-secondary">
      {at && (
        <p>
          <Facts
            items={[
              T.psn.syncedAgo.replace('{when}', relativeTime(new Date(at).toISOString(), lang, 'long')),
              secondsLeft > 0 && copy.refreshIn.replace('{time}', countdown(secondsLeft)),
            ]}
          />
        </p>
      )}
      <p role="status" aria-live="polite" className={message ? 'text-text-main' : 'sr-only'}>
        {message}
      </p>
      {running && (
        <>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${pillClass(open, 'self-start')} sm:hidden`}>
            {copy.chip.replace('{pct}', pct)}
          </button>
          <div className={`flex flex-col gap-2 ${open ? '' : 'max-sm:hidden'}`}>
            <MainPageProfilePsnSyncSteps steps={sync.steps} />
            <ProgressBar pct={sync.progress} label={copy.progress} valueText={copy.progressText.replace('{pct}', pct)} />
            {eta && <p>{eta}</p>}
          </div>
        </>
      )}
    </div>
  )
}
