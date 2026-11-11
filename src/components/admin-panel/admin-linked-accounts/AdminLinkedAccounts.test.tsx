jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import AdminLinkedAccounts from './AdminLinkedAccounts'
import type { AdminUser } from '@/types/user'
import { notify } from '@/lib/notify'

const BOB = {
  id: 11, username: 'bob', email: null, theme: 'dark', avatar: null, admin: false,
  rausername: null, ra_display: null, location: null, steamid: null, steamusername: null,
} as AdminUser

const respond = (ok: boolean, body: unknown) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(body) })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

/** Each platform's boxes, what they send, what the route answers and the account it leaves. */
const PLATFORMS = [
  {
    platform: 'ra', name: 'RetroAchievements',
    typed: { 'RA username': 'bobra', 'RA Web API key': 'key' }, body: { username: 'bobra', apiKey: 'key' },
    answer: { rausername: 'BobRA', ra_display: 'BobRA' }, linked: { rausername: 'BobRA', ra_display: 'Bob the RA' }, shown: 'Bob the RA',
  },
  {
    platform: 'steam', name: 'Steam',
    typed: { 'SteamID64 or profile link': '76561198000000000' }, body: { steamid: '76561198000000000' },
    answer: { steamid: '76561198000000000', steamusername: 'Bobby' }, linked: { steamid: '76561198000000000', steamusername: 'Bobby' }, shown: 'Bobby',
  },
  {
    platform: 'psn', name: 'PSN',
    typed: { 'PSN online ID': 'BobPS' }, body: { username: 'BobPS' },
    answer: { psnaccountid: '123', psnusername: 'BobPS' }, linked: { psnaccountid: '123', psnusername: 'BobPS' }, shown: 'BobPS',
  },
  {
    platform: 'xbox', name: 'Xbox',
    typed: { 'Xbox gamertag': 'BobX' }, body: { gamertag: 'BobX' },
    answer: { xboxxuid: '2535', xboxgamertag: 'BobX' }, linked: { xboxxuid: '2535', xboxgamertag: 'BobX' }, shown: 'BobX',
  },
] as const

const blockOf = (name: string) => screen.getByRole('group', { name })

describe.each(PLATFORMS)('$platform', ({ platform, name, typed, body, answer, linked, shown }) => {
  const [first] = Object.keys(typed)

  test('Link waits for every box, then sends them, reports the change, clears the boxes and says so', async () => {
    respond(true, { ok: true, ...answer })
    const onUpdated = jest.fn()
    render(<AdminLinkedAccounts user={BOB} onUpdated={onUpdated} />)
    const block = blockOf(name)
    const button = within(block).getByRole('button', { name: 'Link' })
    expect(button).toBeDisabled()

    for (const [label, value] of Object.entries(typed)) fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.click(button)

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, answer))
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/accounts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ id: 11, platform, ...body }),
    }))
    expect(notify.success).toHaveBeenCalledWith(`bob: ${name} updated`)
    expect(screen.getByLabelText(first)).toHaveValue('')
  })

  test('a refusal is shown in its own block', async () => {
    respond(false, { error: 'not-configured' })
    render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
    for (const [label, value] of Object.entries(typed)) fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.click(within(blockOf(name)).getByRole('button', { name: 'Link' }))
    expect(await within(blockOf(name)).findByRole('alert')).toHaveTextContent(`${name} is not configured on the server`)
  })

  test('linked: names the account, hides the boxes, and unlinks it', async () => {
    respond(true, { ok: true })
    const onUpdated = jest.fn()
    render(<AdminLinkedAccounts user={{ ...BOB, ...linked }} onUpdated={onUpdated} />)
    expect(screen.getByText(shown)).toBeInTheDocument()
    expect(screen.queryByLabelText(first)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }))
    const cleared = Object.fromEntries(Object.keys(answer).map((k) => [k, null]))
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, cleared))
    expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/accounts?id=11&platform=${platform}`, { method: 'DELETE' })
  })
})

test('each refusal is explained in words', async () => {
  respond(false, { error: 'ra-invalid' })
  render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
  fireEvent.change(screen.getByLabelText('RA username'), { target: { value: 'bob' } })
  fireEvent.change(screen.getByLabelText('RA Web API key'), { target: { value: 'bad' } })
  fireEvent.click(within(blockOf('RetroAchievements')).getByRole('button', { name: 'Link' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('RA refused that username or key')

  respond(false, { error: 'private' })
  fireEvent.change(screen.getByLabelText('PSN online ID'), { target: { value: 'BobPS' } })
  fireEvent.click(within(blockOf('PSN')).getByRole('button', { name: 'Link' }))
  expect(await within(blockOf('PSN')).findByRole('alert')).toHaveTextContent('keeps its trophies private')
})

test('the RA key is typed into a password box', () => {
  render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
  expect(screen.getByLabelText('RA Web API key')).toHaveAttribute('type', 'password')
})

test('a Steam account with no name is still shown as linked, by its id', () => {
  render(<AdminLinkedAccounts user={{ ...BOB, steamid: '76561198000000000' }} onUpdated={jest.fn()} />)
  expect(screen.getByText('76561198000000000')).toBeInTheDocument()
})
