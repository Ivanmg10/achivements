import { cookies, headers } from 'next/headers'
import { serverLanguage } from './serverLanguage'

jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn() }))

function request(cookie: string | undefined, acceptLanguage: string | null) {
  ;(cookies as jest.Mock).mockResolvedValue({ get: (name: string) => (name === 'app-language' && cookie ? { value: cookie } : undefined) })
  ;(headers as jest.Mock).mockResolvedValue({ get: (name: string) => (name === 'accept-language' ? acceptLanguage : null) })
}

test('the person’s choice wins', async () => {
  request('fr', 'es-ES,es;q=0.9')
  expect(await serverLanguage()).toBe('fr')
})

test('else the browser’s first language the app has', async () => {
  request(undefined, 'nl-NL,nl;q=0.9,pt-BR;q=0.8')
  expect(await serverLanguage()).toBe('pt')
})

test('a cookie that is not a language is ignored; nothing that fits is null', async () => {
  request('xx', 'sv,nl')
  expect(await serverLanguage()).toBeNull()
  request(undefined, null)
  expect(await serverLanguage()).toBeNull()
})
