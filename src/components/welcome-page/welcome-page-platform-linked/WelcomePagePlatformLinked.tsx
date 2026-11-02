import type { ReactNode } from 'react'
import Image from 'next/image'
import { IconCheck } from '@tabler/icons-react'
import type { PlatformStep } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
import { STEP_SKY } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * A platform once linked, the same card for all of them: its colours, the
 * account, a tick that lands as it arrives, and its games being read for Vault
 * Points, or why they cannot be. `picture` is the platform's own, when there is one.
 */
export default function WelcomePagePlatformLinked({
  platform,
  name,
  mark,
  picture,
}: {
  platform: PlatformStep
  name: string
  mark: ReactNode
  picture?: string | null
}) {
  const { T } = useLanguage()

  return (
    <div className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.08] overflow-hidden`}>
      <div aria-hidden="true" className="h-20 flex items-start justify-end p-4 text-white" style={{ background: STEP_SKY[platform] }}>
        {picture && mark}
      </div>
      <div className="px-5 pb-5 -mt-8 flex flex-col gap-3 min-w-0">
        <span className="relative w-16 h-16">
          {picture ? (
            <Image src={picture} alt="" width={64} height={64} unoptimized className="w-16 h-16 rounded-tile object-cover ring-4 ring-bg-card" />
          ) : (
            <span aria-hidden="true" className="w-16 h-16 rounded-tile bg-bg-main ring-4 ring-bg-card flex items-center justify-center text-text-main">
              {mark}
            </span>
          )}
          <span aria-hidden="true" className={`${styles.pop} absolute -right-1.5 -bottom-1.5 w-6 h-6 rounded-full bg-success text-bg-main ring-[3px] ring-bg-card flex items-center justify-center`}>
            <IconCheck size={14} stroke={3} />
          </span>
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-xl font-extrabold tracking-tight truncate">{name}</span>
          <span className="text-[0.8125rem] font-semibold text-success">{T.welcome.done.linked}</span>
        </span>
        <VaultFillLine source={platform} />
      </div>
    </div>
  )
}
