import {
  cookieFromHeader,
  linkReturn,
  returnParams,
  stateCookie,
  readTicket,
  signTicket,
  steamLoginUrl,
  ticketFromCookieHeader,
  TICKET_TTL_MS,
  usernameFromPersona,
  verifySteamLogin,
} from './steamLogin'

const BASE = 'https://www.cheevovault.com'
const ID = '76561197960287930'
const NOW = 1_790_000_000_000

/** What Steam sends back to the callback after a good sign-in. */
function answer(overrides: Record<string, string> = {}) {
  return new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'id_res',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.claimed_id': `https://steamcommunity.com/openid/id/${ID}`,
    'openid.identity': `https://steamcommunity.com/openid/id/${ID}`,
    'openid.return_to': `${BASE}/api/auth/steam/callback`,
    'openid.response_nonce': '2026-10-21T10:00:00Zabc',
    'openid.assoc_handle': '1234567890',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    'openid.sig': 'c2lnbmF0dXJl',
    ...overrides,
  })
}

function steamSays(text: string, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, text: async () => text })
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
})

test('the sign-in link sends Steam back to our callback, with what we asked it to carry', () => {
  const url = new URL(steamLoginUrl(BASE, new URLSearchParams({ intent: 'link', state: 'abc' })))
  expect(url.origin + url.pathname).toBe('https://steamcommunity.com/openid/login')
  expect(url.searchParams.get('openid.return_to')).toBe(`${BASE}/api/auth/steam/callback?intent=link&state=abc`)
  expect(url.searchParams.get('openid.realm')).toBe(BASE)
})

test('what comes back is read from the return URL Steam signed', () => {
  const back = returnParams(answer({ 'openid.return_to': `${BASE}/api/auth/steam/callback?intent=link&state=abc` }))
  expect(back.get('intent')).toBe('link')
  expect(back.get('state')).toBe('abc')
  expect(returnParams(new URLSearchParams()).get('state')).toBeNull()
})

test('a link only returns to the pages it starts from', () => {
  expect(linkReturn('/')).toBe('/')
  expect(linkReturn('/user')).toBe('/user')
  expect(linkReturn('/welcome')).toBe('/welcome')
  expect(linkReturn('https://evil.example')).toBe('/user')
  expect(linkReturn('//evil.example')).toBe('/user')
  expect(linkReturn(null)).toBe('/user')
})

test('the state cookie is only sent back to the callback', () => {
  expect(stateCookie('abc', true)).toBe('steam-state=abc; Path=/api/auth/steam/callback; HttpOnly; SameSite=Lax; Max-Age=600; Secure')
  expect(cookieFromHeader('a=1; steam-state=abc', 'steam-state')).toBe('abc')
})

test('a confirmed answer gives the SteamID64, after asking Steam to check its signature', async () => {
  steamSays('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n')
  expect(await verifySteamLogin(answer(), BASE)).toBe(ID)
  const [, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(String(init.body)).toContain('openid.mode=check_authentication')
})

test('Steam refusing the signature is no sign-in', async () => {
  steamSays('ns:http://specs.openid.net/auth/2.0\nis_valid:false\n')
  expect(await verifySteamLogin(answer(), BASE)).toBeNull()
})

test.each([
  ['a cancelled sign-in', { 'openid.mode': 'cancel' }],
  ['an answer meant for another site', { 'openid.return_to': 'https://evil.example/api/auth/steam/callback' }],
  ['another provider', { 'openid.op_endpoint': 'https://evil.example/openid' }],
  ['an id that is not Steam\'s', { 'openid.claimed_id': 'https://evil.example/id/1', 'openid.identity': 'https://evil.example/id/1' }],
  ['a claimed id Steam did not sign', { 'openid.signed': 'signed,op_endpoint,identity,return_to,response_nonce' }],
])('%s is refused without asking Steam', async (_name, overrides) => {
  steamSays('is_valid:true')
  expect(await verifySteamLogin(answer(overrides), BASE)).toBeNull()
  expect(global.fetch).not.toHaveBeenCalled()
})

test('Steam not answering throws, so the callback can say "try later"', async () => {
  steamSays('', false)
  await expect(verifySteamLogin(answer(), BASE)).rejects.toThrow()
})

test('a ticket carries its SteamID64 for ten minutes, and no longer', () => {
  const ticket = signTicket(ID, NOW)
  expect(readTicket(ticket, NOW + 1000)).toBe(ID)
  expect(readTicket(ticket, NOW + TICKET_TTL_MS + 1)).toBeNull()
})

test('a forged or garbled ticket carries nothing', () => {
  const ticket = signTicket(ID, NOW)
  expect(readTicket(ticket.replace(ID, '76561197960287931'), NOW)).toBeNull()
  expect(readTicket('nonsense', NOW)).toBeNull()
  expect(readTicket(undefined, NOW)).toBeNull()
})

test('the ticket is read from a Cookie header among others', () => {
  const ticket = signTicket(ID, NOW)
  expect(ticketFromCookieHeader(`a=1; steam-login=${encodeURIComponent(ticket)}; b=2`)).toBe(ticket)
  expect(ticketFromCookieHeader('a=1')).toBeNull()
  expect(ticketFromCookieHeader(undefined)).toBeNull()
})

test('a Steam name becomes a username when it can', () => {
  expect(usernameFromPersona('Gabe Newell')).toBe('Gabe_Newell')
  expect(usernameFromPersona('★ Ñoño ★')).toBe('_oo_')
  expect(usernameFromPersona('ab')).toBe('')
  expect(usernameFromPersona('a'.repeat(30))).toHaveLength(20)
})
