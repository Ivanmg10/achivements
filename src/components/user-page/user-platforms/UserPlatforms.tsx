'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { IconDeviceGamepad2 } from '@tabler/icons-react'
import UserPlatformCard from '@/components/user-page/user-platform-card/UserPlatformCard'
import RaLoginModal from '@/components/ra-login-modal/RaLoginModal'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import UserRaStats from '@/components/user-stats/user-ra-stats/UserRaStats'
import UserSteamStats from '@/components/user-stats/user-steam-stats/UserSteamStats'
import ExpandPanel from '@/components/expand-panel/ExpandPanel'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamLink, STEAM_LINK_URL, SteamLinkStatus } from '@/hooks/useSteamLink'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { RetroAchievementsUserProfile } from '@/types/types'

type Platform = 'ra' | 'steam'

/** Only 'linked' is good news — the rest are warnings the user may need to act on. */
function isLinkError(status: SteamLinkStatus) {
  return status !== null && status !== 'linked'
}

const DISCONNECT_CLASS =
  'w-full py-2 rounded-xl bg-red-500/15 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70'
const CONNECT_CLASS =
  'w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent text-bg-main font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * The three platforms CheevoVault can track, side by side: connect one, open
 * its numbers, or disconnect it. Opening a platform's data shows it in full
 * width below the cards, so only one set of figures is on screen at a time.
 */
export default function UserPlatforms() {
  const { data: session, update } = useSession()
  const { T } = useLanguage()
  const { steamId, steamUsername, isLinked: steamLinked, status, isUnlinking, disconnect } = useSteamLink()
  const [raModalOpen, setRaModalOpen] = useState(false)
  const [openPlatform, setOpenPlatform] = useState<Platform | null>(null)
  const panelId = useId()

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined
  const raConnected = Boolean(session?.user?.rausername)

  const STEAM_MESSAGES: Record<Exclude<SteamLinkStatus, null>, string> = {
    linked: T.userData.steamLinked,
    alreadyLinked: T.userData.steamAlreadyLinked,
    cancelled: T.userData.steamCancelled,
    failed: T.userData.steamFailed,
  }

  const toggle = (platform: Platform) => setOpenPlatform((p) => (p === platform ? null : platform))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UserPlatformCard
          name="RetroAchievements"
          logo={<RaLogo height={18} />}
          accent="bg-[#2a80c7]"
          connected={raConnected}
          dataOpen={openPlatform === 'ra'}
          onToggleData={() => toggle('ra')}
          dataPanelId={panelId}
          identity={
            raUser?.User ? (
              <div className="flex items-center gap-3 bg-bg-main rounded-2xl p-3">
                {raUser.UserPic && (
                  <Image
                    src={`https://retroachievements.org${raUser.UserPic}`}
                    alt=""
                    width={44}
                    height={44}
                    className="rounded-lg w-11 h-11 object-cover shrink-0"
                    unoptimized
                  />
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold truncate">{raUser.User}</span>
                  <span className="text-xs text-text-secondary">
                    {T.profileStats.hardcorePoints}:{' '}
                    <span className="text-text-main">{(raUser.TotalPoints ?? 0).toLocaleString()}</span>
                  </span>
                  <span className="text-xs text-text-secondary font-mono truncate">{raUser.ULID}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">{T.userPage.raConnectHint}</p>
            )
          }
          connectAction={
            <button onClick={() => setRaModalOpen(true)} className={CONNECT_CLASS}>
              <RaLogo height={14} />
              {T.userData.signInRA}
            </button>
          }
          disconnectAction={
            <button onClick={() => unlinkRaUser(update)} className={DISCONNECT_CLASS}>
              {T.userConfig.signOutRA}
            </button>
          }
        />

        <UserPlatformCard
          name="Steam"
          logo={<SteamLogo size={18} className="text-[#66c0f4]" aria-hidden="true" />}
          accent="bg-[#66c0f4]"
          connected={steamLinked}
          dataOpen={openPlatform === 'steam'}
          onToggleData={() => toggle('steam')}
          dataPanelId={panelId}
          status={
            status && (
              <p
                role={isLinkError(status) ? 'alert' : 'status'}
                className={`text-xs ${isLinkError(status) ? 'text-red-400' : 'text-green-400'}`}
              >
                {STEAM_MESSAGES[status]}
              </p>
            )
          }
          identity={
            steamLinked ? (
              <div className="flex items-center gap-3 bg-bg-main rounded-2xl p-3">
                <SteamLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold truncate">{steamUsername || '—'}</span>
                  <span className="text-xs text-text-secondary font-mono truncate">{steamId}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">{T.userPage.steamConnectHint}</p>
            )
          }
          connectAction={
            <a href={STEAM_LINK_URL} className={CONNECT_CLASS}>
              <SteamLogo size={16} aria-hidden="true" />
              {T.userData.steamConnect}
            </a>
          }
          disconnectAction={
            <button onClick={disconnect} disabled={isUnlinking} className={DISCONNECT_CLASS}>
              {isUnlinking ? T.userData.steamDisconnecting : T.userData.steamDisconnect}
            </button>
          }
        />

        <UserPlatformCard
          name="PlayStation Network"
          logo={<IconDeviceGamepad2 size={18} className="text-[#0070d1]" aria-hidden="true" />}
          accent="bg-[#0070d1]"
          connected={false}
          soon
          identity={<p className="text-sm text-text-secondary">{T.userPage.psnHint}</p>}
          connectAction={
            <button disabled className={`${CONNECT_CLASS} opacity-50 cursor-not-allowed`}>
              {T.userData.comingSoon}
            </button>
          }
        />
      </div>

      <ExpandPanel open={openPlatform !== null} id={panelId}>
        <div className="pt-1">{openPlatform === 'ra' ? <UserRaStats /> : <UserSteamStats />}</div>
      </ExpandPanel>

      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
    </div>
  )
}
