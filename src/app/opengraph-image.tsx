import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/siteUrl'

export const alt = 'CheevoVault — every achievement you have earned, in one place'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The preview card shown when a link to the site is shared. Colours from the dark theme. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: 'rgb(15 16 20)',
          color: 'rgb(250 250 255)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 44, marginTop: 24, color: 'rgb(180 185 200)', maxWidth: 900 }}>
          Every achievement you have earned, in one place
        </div>
        <div style={{ fontSize: 32, marginTop: 56, color: 'rgb(148 153 168)' }}>RetroAchievements · Steam · PlayStation</div>
      </div>
    ),
    size,
  )
}
