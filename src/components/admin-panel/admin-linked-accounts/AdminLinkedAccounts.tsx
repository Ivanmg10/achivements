import { useState } from 'react'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { adminFetch } from '@/utils/adminFetch'
import type { AdminUser } from '@/types/user'
import { notify } from '@/lib/notify'
import { buttonClass } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

type Platform = 'ra' | 'steam' | 'psn' | 'xbox'

const PLATFORM_NAMES: Record<Platform, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PSN', xbox: 'Xbox' }

const BUTTON = 'shrink-0 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40'

/**
 * Links or unlinks a user's RetroAchievements, Steam, PSN and Xbox accounts, for support.
 * RA needs the user's own username and Web API key (RA checks them); Steam a
 * SteamID64 or profile link (Steam checks it exists). Each change is logged.
 */
export default function AdminLinkedAccounts({
  user,
  onUpdated,
}: {
  user: AdminUser
  onUpdated: (userId: number, changes: Partial<AdminUser>) => void
}) {
  const [raUsername, setRaUsername] = useState('')
  const [raKey, setRaKey] = useState('')
  const [steamId, setSteamId] = useState('')
  const [psnName, setPsnName] = useState('')
  const [xboxName, setXboxName] = useState('')
  const [busy, setBusy] = useState<Platform | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Platform, string>>>({})

  const run = async (platform: Platform, request: () => Promise<Response>, onDone: (data: Record<string, unknown>) => void) => {
    setBusy(platform)
    setErrors((e) => ({ ...e, [platform]: undefined }))
    try {
      const res = await request()
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const known: Record<string, string> = {
          'ra-invalid': 'RA refused that username or key',
          private: platform === 'xbox' ? 'That Xbox profile keeps its games private' : 'That PSN profile keeps its trophies private',
          'not-configured': `${PLATFORM_NAMES[platform]} is not configured on the server`,
          failed: platform === 'xbox' ? 'Xbox (OpenXBL) is not answering, try again' : 'Sony is not answering, try again',
        }
        const message = known[data.error] ?? data.error
        setErrors((e) => ({ ...e, [platform]: message ?? 'Something went wrong' }))
        return
      }
      onDone(data)
      notify.success(`${user.username}: ${PLATFORM_NAMES[platform]} updated`)
    } catch {
      setErrors((e) => ({ ...e, [platform]: 'Something went wrong' }))
    } finally {
      setBusy(null)
    }
  }

  const link = (platform: Platform, body: Record<string, unknown>, onDone: (data: Record<string, unknown>) => void) =>
    run(platform, () => adminFetch('/api/admin/users/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, platform, ...body }),
    }), onDone)

  const unlink = (platform: Platform, changes: Partial<AdminUser>) =>
    run(platform, () => adminFetch(`/api/admin/users/accounts?id=${user.id}&platform=${platform}`, { method: 'DELETE' }), () =>
      onUpdated(user.id, changes))

  return (
    <div className="bg-bg-main/50 rounded-xl p-3 flex flex-col gap-4">
      <span className="text-xs text-text-secondary uppercase tracking-wider">Linked accounts</span>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <RaLogo height={12} />
          {user.rausername ? (
            <>
              <span className="font-medium flex-1 truncate">{user.ra_display ?? user.rausername}</span>
              <button
                onClick={() => unlink('ra', { rausername: null, ra_display: null })}
                disabled={busy !== null}
                className={`${BUTTON} text-danger hover:bg-danger/10`}
              >
                Unlink
              </button>
            </>
          ) : (
            <span className="text-text-secondary italic">Not linked</span>
          )}
        </div>
        {!user.rausername && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input aria-label="RA username" placeholder="RA username" value={raUsername} onChange={(e) => setRaUsername(e.target.value)} className={fieldClass({ size: 'sm' })} />
            <input aria-label="RA Web API key" placeholder="Web API key" type="password" autoComplete="off" value={raKey} onChange={(e) => setRaKey(e.target.value)} className={fieldClass({ size: 'sm' })} />
            <button
              onClick={() => link('ra', { username: raUsername, apiKey: raKey }, (data) => {
                setRaUsername('')
                setRaKey('')
                onUpdated(user.id, { rausername: data.rausername as string, ra_display: data.ra_display as string })
              })}
              disabled={busy !== null || !raUsername.trim() || !raKey.trim()}
              className={buttonClass('primary', 'sm', 'shrink-0')}
            >
              {busy === 'ra' ? '…' : 'Link'}
            </button>
          </div>
        )}
        {errors.ra && <span role="alert" className="text-xs text-danger">{errors.ra}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <SteamLogo size={12} className="text-[#66c0f4]" />
          {user.steamid ? (
            <>
              <span className="font-medium flex-1 truncate">{user.steamusername ?? user.steamid}</span>
              <button
                onClick={() => unlink('steam', { steamid: null, steamusername: null })}
                disabled={busy !== null}
                className={`${BUTTON} text-danger hover:bg-danger/10`}
              >
                Unlink
              </button>
            </>
          ) : (
            <span className="text-text-secondary italic">Not linked</span>
          )}
        </div>
        {!user.steamid && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input aria-label="SteamID64 or profile link" placeholder="SteamID64 or steamcommunity.com/profiles/…" value={steamId} onChange={(e) => setSteamId(e.target.value)} className={fieldClass({ size: 'sm' })} />
            <button
              onClick={() => link('steam', { steamid: steamId }, (data) => {
                setSteamId('')
                onUpdated(user.id, { steamid: data.steamid as string, steamusername: data.steamusername as string | null })
              })}
              disabled={busy !== null || !steamId.trim()}
              className={buttonClass('primary', 'sm', 'shrink-0')}
            >
              {busy === 'steam' ? '…' : 'Link'}
            </button>
          </div>
        )}
        {errors.steam && <span role="alert" className="text-xs text-danger">{errors.steam}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <PlaystationLogo size={12} className="text-[#0070d1]" />
          {user.psnaccountid ? (
            <>
              <span className="font-medium flex-1 truncate">{user.psnusername ?? user.psnaccountid}</span>
              <button
                onClick={() => unlink('psn', { psnaccountid: null, psnusername: null })}
                disabled={busy !== null}
                className={`${BUTTON} text-danger hover:bg-danger/10`}
              >
                Unlink
              </button>
            </>
          ) : (
            <span className="text-text-secondary italic">Not linked</span>
          )}
        </div>
        {!user.psnaccountid && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input aria-label="PSN online ID" placeholder="PSN online ID" value={psnName} onChange={(e) => setPsnName(e.target.value)} className={fieldClass({ size: 'sm' })} />
            <button
              onClick={() => link('psn', { username: psnName }, (data) => {
                setPsnName('')
                onUpdated(user.id, { psnaccountid: data.psnaccountid as string, psnusername: data.psnusername as string })
              })}
              disabled={busy !== null || !psnName.trim()}
              className={buttonClass('primary', 'sm', 'shrink-0')}
            >
              {busy === 'psn' ? '…' : 'Link'}
            </button>
          </div>
        )}
        {errors.psn && <span role="alert" className="text-xs text-danger">{errors.psn}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <XboxLogo size={12} className="text-[#107c10]" />
          {user.xboxxuid ? (
            <>
              <span className="font-medium flex-1 truncate">{user.xboxgamertag ?? user.xboxxuid}</span>
              <button
                onClick={() => unlink('xbox', { xboxxuid: null, xboxgamertag: null })}
                disabled={busy !== null}
                className={`${BUTTON} text-danger hover:bg-danger/10`}
              >
                Unlink
              </button>
            </>
          ) : (
            <span className="text-text-secondary italic">Not linked</span>
          )}
        </div>
        {!user.xboxxuid && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input aria-label="Xbox gamertag" placeholder="Xbox gamertag" value={xboxName} onChange={(e) => setXboxName(e.target.value)} className={fieldClass({ size: 'sm' })} />
            <button
              onClick={() => link('xbox', { gamertag: xboxName }, (data) => {
                setXboxName('')
                onUpdated(user.id, { xboxxuid: data.xboxxuid as string, xboxgamertag: data.xboxgamertag as string })
              })}
              disabled={busy !== null || !xboxName.trim()}
              className={buttonClass('primary', 'sm', 'shrink-0')}
            >
              {busy === 'xbox' ? '…' : 'Link'}
            </button>
          </div>
        )}
        {errors.xbox && <span role="alert" className="text-xs text-danger">{errors.xbox}</span>}
      </div>
    </div>
  )
}
