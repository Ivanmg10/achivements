import { useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'
import { ADMIN_PLATFORMS, AdminPlatform, adminAccount, adminAccountChanges } from '@/utils/adminPlatforms'
import type { AdminUser } from '@/types/user'
import type { GameSource } from '@/types/game'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import Kicker from '@/components/ui/Kicker'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

/** What a refusal means, in the panel's words; anything else is shown as the route sent it. */
function refusal(code: string | undefined, { source, name }: AdminPlatform): string | undefined {
  const known: Record<string, string> = {
    'ra-invalid': 'RA refused that username or key',
    private: source === 'xbox' ? 'That Xbox profile keeps its games private' : 'That PSN profile keeps its trophies private',
    'not-configured': `${name} is not configured on the server`,
    failed: source === 'xbox' ? 'Xbox (OpenXBL) is not answering, try again' : 'Sony is not answering, try again',
  }
  return code === undefined ? undefined : (known[code] ?? code)
}

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
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<GameSource | null>(null)
  const [errors, setErrors] = useState<Partial<Record<GameSource, string>>>({})

  const run = async (platform: AdminPlatform, request: () => Promise<Response>, onDone: (data: Record<string, unknown>) => void) => {
    const { source } = platform
    setBusy(source)
    setErrors((e) => ({ ...e, [source]: undefined }))
    try {
      const res = await request()
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors((e) => ({ ...e, [source]: refusal(data.error, platform) ?? 'Something went wrong' }))
        return
      }
      onDone(data)
      notify.success(`${user.username}: ${platform.name} updated`)
    } catch {
      setErrors((e) => ({ ...e, [source]: 'Something went wrong' }))
    } finally {
      setBusy(null)
    }
  }

  const valueOf = (source: GameSource, key: string) => values[`${source}.${key}`] ?? ''

  const link = (platform: AdminPlatform) => {
    const body = Object.fromEntries(platform.inputs.map(({ key }) => [key, valueOf(platform.source, key)]))
    return run(
      platform,
      () => adminFetch('/api/admin/users/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, platform: platform.source, ...body }),
      }),
      (data) => {
        setValues((v) => Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith(`${platform.source}.`))))
        onUpdated(user.id, adminAccountChanges(platform, data))
      },
    )
  }

  const unlink = (platform: AdminPlatform) =>
    run(platform, () => adminFetch(`/api/admin/users/accounts?id=${user.id}&platform=${platform.source}`, { method: 'DELETE' }), () =>
      onUpdated(user.id, adminAccountChanges(platform)))

  return (
    <div className="bg-bg-main/50 rounded-tile p-3 flex flex-col gap-4">
      <Kicker as="span" size="md">Linked accounts</Kicker>

      {ADMIN_PLATFORMS.map((platform) => {
        const { source, name, inputs } = platform
        const account = adminAccount(user, platform)
        return (
          <div key={source} role="group" aria-label={name} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <PlatformLogo source={source} />
              {account ? (
                <>
                  <span className="font-medium flex-1 truncate">{account}</span>
                  <Button variant="danger" size="sm" className="shrink-0" onClick={() => unlink(platform)} disabled={busy !== null}>
                    Unlink
                  </Button>
                </>
              ) : (
                <span className="text-text-secondary italic">Not linked</span>
              )}
            </div>
            {!account && (
              <div className="flex flex-col sm:flex-row gap-2">
                {inputs.map(({ key, label, placeholder, secret }) => (
                  <input
                    key={key}
                    aria-label={label}
                    placeholder={placeholder}
                    type={secret ? 'password' : undefined}
                    autoComplete={secret ? 'off' : undefined}
                    value={valueOf(source, key)}
                    onChange={(e) => setValues((v) => ({ ...v, [`${source}.${key}`]: e.target.value }))}
                    className={fieldClass({ size: 'sm' })}
                  />
                ))}
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => link(platform)}
                  disabled={busy !== null || inputs.some(({ key }) => !valueOf(source, key).trim())}
                >
                  {busy === source ? '…' : 'Link'}
                </Button>
              </div>
            )}
            {errors[source] && <span role="alert" className="text-xs text-danger">{errors[source]}</span>}
          </div>
        )
      })}
    </div>
  )
}
