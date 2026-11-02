import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/siteUrl'
import { profileTeaser } from '@/lib/rankings'
import { levelOf, tierOf } from '@/utils/vaultLevel'
import { en } from '@/translations/en'
import SiteImage from '@/app/opengraph-image'

export const alt = 'A CheevoVault profile: level and Vault Points'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PLATFORMS = [
  { source: 'ra', name: 'RetroAchievements', color: 'rgb(167 139 250)' },
  { source: 'steam', name: 'Steam', color: '#66c0f4' },
  { source: 'psn', name: 'PlayStation', color: '#0070d1' },
] as const

/**
 * The preview card of a shared profile link: the same as the rankings show
 * (profileTeaser), in English, as crawlers ask in no language. Anyone not in
 * the rankings gets the site's card, so it says nothing about them.
 */
export default async function ProfileImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const teaser = await profileTeaser(decodeURIComponent(username)).catch((err) => {
    console.error('[profile image]', err)
    return null
  })
  if (!teaser) return SiteImage()

  const level = levelOf(teaser.points)
  const shown = PLATFORMS.filter((p) => (teaser.split[p.source] ?? 0) > 0)
  const total = shown.reduce((sum, p) => sum + (teaser.split[p.source] ?? 0), 0)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 88,
          background: 'rgb(15 16 20)',
          color: 'rgb(250 250 255)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {/* ponytail: the initial, never the picture: a pasted avatar link would be fetched from our server (SSRF); allow RA's and Steam's hosts if the picture is wanted. */}
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 76,
              fontWeight: 800,
              background: 'rgb(167 139 250 / 0.18)',
              color: 'rgb(167 139 250)',
            }}
          >
            {teaser.username.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -2 }}>{teaser.username}</div>
            <div style={{ fontSize: 38, color: 'rgb(180 185 200)' }}>
              {`Level ${level} · ${en.rankings.tiers[tierOf(level)]} · ${teaser.points.toLocaleString('en')} Vault Points`}
            </div>
          </div>
        </div>

        {total > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 64 }}>
            <div style={{ display: 'flex', height: 22, borderRadius: 11, overflow: 'hidden' }}>
              {shown.map((p) => (
                <div key={p.source} style={{ width: `${((teaser.split[p.source] ?? 0) / total) * 100}%`, background: p.color }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 40, fontSize: 30, color: 'rgb(180 185 200)' }}>
              {shown.map((p) => (
                <div key={p.source} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: p.color }} />
                  {`${p.name} ${Math.round(((teaser.split[p.source] ?? 0) / total) * 100)} %`}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 32, color: 'rgb(148 153 168)' }}>
          {`${teaser.completed.toLocaleString('en')} games at 100% · ${teaser.achievements.toLocaleString('en')} achievements · ${SITE_NAME}`}
        </div>
      </div>
    ),
    size,
  )
}
