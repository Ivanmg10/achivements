/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, allowedImageUrl } from './route'

const ORIGIN = 'http://localhost:3000'
const fake = (body: BodyInit, type: string, url: string) => {
  const r = new Response(body, { headers: { 'content-type': type } })
  Object.defineProperty(r, 'url', { value: url })
  return r
}
const req = (url: string) => new NextRequest(`${ORIGIN}/api/image-proxy?url=${encodeURIComponent(url)}`)

describe('allowedImageUrl', () => {
  it('takes the platforms image hosts over https', () => {
    expect(allowedImageUrl('https://media.retroachievements.org/Images/1.png', ORIGIN)).not.toBeNull()
    expect(allowedImageUrl('https://cdn.cloudflare.steamstatic.com/a.jpg', ORIGIN)).not.toBeNull()
    expect(allowedImageUrl('https://image.api.playstation.com/x.png', ORIGIN)).not.toBeNull()
  })

  it('refuses anything else', () => {
    expect(allowedImageUrl('http://media.retroachievements.org/a.png', ORIGIN)).toBeNull()
    expect(allowedImageUrl('https://evil.com/a.png', ORIGIN)).toBeNull()
    expect(allowedImageUrl('https://notsteamstatic.com/a.png', ORIGIN)).toBeNull()
    expect(allowedImageUrl('/api/users', ORIGIN)).toBeNull()
    expect(allowedImageUrl('http://169.254.169.254/latest', ORIGIN)).toBeNull()
  })

  it('lets our own Steam icon route through', () => {
    expect(allowedImageUrl('/api/steam/icon?appid=620', ORIGIN)).not.toBeNull()
  })
})

describe('GET', () => {
  afterEach(() => jest.restoreAllMocks())

  it('refuses a host it does not know', async () => {
    expect((await GET(req('https://evil.com/a.png'))).status).toBe(400)
  })

  it('serves an image with a long cache', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      fake(new Uint8Array([1, 2, 3]), 'image/png', 'https://media.retroachievements.org/a.png'),
    )
    const res = await GET(req('https://media.retroachievements.org/a.png'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Cache-Control')).toContain('max-age')
  })

  it.each(['text/html', 'image/svg+xml', 'image/svg+xml; charset=utf-8', 'IMAGE/SVG+XML'])('refuses %s', async (type) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(fake('<svg/>', type, 'https://media.retroachievements.org/a'))
    expect((await GET(req('https://media.retroachievements.org/a'))).status).toBe(415)
  })

  it('takes the icons Steam serves', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(fake(new Uint8Array([0, 0, 1, 0]), 'image/x-icon', 'https://cdn.akamai.steamstatic.com/a.ico'))
    expect((await GET(req('https://cdn.akamai.steamstatic.com/a.ico'))).status).toBe(200)
  })

  const redirect = (location: string) => new Response(null, { status: 302, headers: { location } })

  it('checks every hop of a redirect and never requests one off the list', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(redirect('https://evil.com/a.png'))
    expect((await GET(req('https://media.retroachievements.org/b.png'))).status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('follows a redirect that stays on the list', async () => {
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(redirect('https://cdn.akamai.steamstatic.com/a.png'))
      .mockResolvedValueOnce(fake(new Uint8Array([1]), 'image/png', 'https://cdn.akamai.steamstatic.com/a.png'))
    expect((await GET(req('https://media.retroachievements.org/b.png'))).status).toBe(200)
    expect(String(fetchMock.mock.calls[1][0])).toContain('cdn.akamai.steamstatic.com')
  })

  it('gives up on a redirect loop', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => redirect('https://media.retroachievements.org/a.png'))
    expect((await GET(req('https://media.retroachievements.org/a.png'))).status).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('stops reading an image past the limit, whatever it declares', async () => {
    const big = new Uint8Array(1024 * 1024)
    let sent = 0
    const body = new ReadableStream({ pull(c) { sent++; c.enqueue(big) } })
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(body, { headers: { 'content-type': 'image/png' } }))
    expect((await GET(req('https://media.retroachievements.org/a.png'))).status).toBe(413)
    expect(sent).toBeLessThan(6)
  })

  it('refuses an image that declares it is too large without reading it', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('x', { headers: { 'content-type': 'image/png', 'content-length': String(4 * 1024 * 1024) } }))
    expect((await GET(req('https://media.retroachievements.org/a.png'))).status).toBe(413)
  })

  it('says when the host fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('down'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect((await GET(req('https://media.retroachievements.org/a.png'))).status).toBe(502)
  })
})
