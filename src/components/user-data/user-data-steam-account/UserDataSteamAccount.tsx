'use client'

import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamLink, STEAM_LINK_URL, SteamLinkStatus } from '@/hooks/useSteamLink'

/** Only 'linked' is good news — the rest are warnings the user may need to act on. */
function isError(status: SteamLinkStatus) {
  return status !== null && status !== 'linked'
}

export default function UserDataSteamAccount() {
  const { T } = useLanguage()
  const { steamId, steamUsername, isLinked, status, isUnlinking, disconnect } = useSteamLink()

  const MESSAGES: Record<Exclude<SteamLinkStatus, null>, string> = {
    linked: T.userData.steamLinked,
    alreadyLinked: T.userData.steamAlreadyLinked,
    cancelled: T.userData.steamCancelled,
    failed: T.userData.steamFailed,
  }

  return (
    <div className="bg-bg-main rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-secondary">Steam</span>
        {isLinked ? (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            {T.userData.connected}
          </span>
        ) : (
          <a
            href={STEAM_LINK_URL}
            className="text-xs bg-accent text-bg-main px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
          >
            {T.userData.connect}
          </a>
        )}
      </div>

      {status && (
        <p
          role={isError(status) ? 'alert' : 'status'}
          className={`text-xs ${isError(status) ? 'text-red-400' : 'text-green-400'}`}
        >
          {MESSAGES[status]}
        </p>
      )}

      {isLinked ? (
        <>
          <div className="flex items-center gap-3">
            <IconBrandSteam size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold truncate">{steamUsername || '—'}</span>
              <span className="text-xs text-text-secondary font-mono truncate">{steamId}</span>
            </div>
          </div>
          <button
            onClick={disconnect}
            disabled={isUnlinking}
            className="w-full bg-red-500 text-white font-bold py-2 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            {isUnlinking ? T.userData.steamDisconnecting : T.userData.steamDisconnect}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">{T.userData.notConnected}</p>
          <a
            href={STEAM_LINK_URL}
            className="w-full bg-accent text-bg-main font-bold py-2 rounded-xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
          >
            <IconBrandSteam size={18} aria-hidden="true" />
            {T.userData.steamConnect}
          </a>
        </>
      )}
    </div>
  )
}
