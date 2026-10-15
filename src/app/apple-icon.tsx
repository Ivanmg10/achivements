import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** The home-screen icon on iOS: the same "CH" as the favicon, until there is a logo. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1014',
          color: '#fafaff',
          fontSize: 80,
          fontWeight: 600,
          letterSpacing: 2,
          fontFamily: 'sans-serif',
        }}
      >
        CH
      </div>
    ),
    size,
  )
}
