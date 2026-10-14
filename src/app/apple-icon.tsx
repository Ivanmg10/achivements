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
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -3,
          fontFamily: 'sans-serif',
          borderBottom: '10px solid #3ddc84',
        }}
      >
        CH
      </div>
    ),
    size,
  )
}
