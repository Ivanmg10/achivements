'use client'

import { ReactNode } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * One platform on the account page: its logo, whether it is connected, who
 * it is connected as, and the three things you can do with it — connect,
 * look at your data, disconnect.
 *
 * The shell is shared so RetroAchievements, Steam and PlayStation read as
 * the same kind of thing; each card passes its own identity block, buttons
 * and accent. A platform that is not available yet passes `soon`.
 */
export default function UserPlatformCard({
  name,
  logo,
  accent,
  connected,
  soon = false,
  status,
  identity,
  connectAction,
  disconnectAction,
  dataOpen,
  onToggleData,
  dataPanelId,
}: {
  name: string
  logo: ReactNode
  /** Tailwind classes tinting the card's top edge and chips. */
  accent: string
  connected: boolean
  soon?: boolean
  /** A message about the last connection attempt. */
  status?: ReactNode
  /** Account details once connected. */
  identity?: ReactNode
  connectAction?: ReactNode
  disconnectAction?: ReactNode
  dataOpen?: boolean
  onToggleData?: () => void
  dataPanelId?: string
}) {
  const { T } = useLanguage()

  return (
    <section
      aria-label={name}
      className={`relative bg-bg-card rounded-3xl p-5 flex flex-col gap-3 ring-1 ring-white/5 overflow-hidden ${
        soon ? 'opacity-60' : ''
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          {logo}
          <span className="font-semibold truncate">{name}</span>
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            soon
              ? 'bg-white/5 text-text-secondary'
              : connected
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/5 text-text-secondary'
          }`}
        >
          {soon ? T.userData.comingSoon : connected ? T.userData.connected : T.userData.notConnected}
        </span>
      </div>

      {status}

      <div className="flex-1 min-h-0">{identity}</div>

      <div className="flex flex-col gap-2">
        {connected && onToggleData && (
          <button
            onClick={onToggleData}
            aria-expanded={dataOpen}
            aria-controls={dataPanelId}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-bg-main text-sm font-medium text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {dataOpen ? T.userPage.hideData : T.userPage.viewData}
            <IconChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform duration-300 ${dataOpen ? 'rotate-180' : ''}`}
            />
          </button>
        )}
        {connected ? disconnectAction : connectAction}
      </div>
    </section>
  )
}
