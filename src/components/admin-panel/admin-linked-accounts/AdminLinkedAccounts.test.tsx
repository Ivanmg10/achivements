import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminLinkedAccounts from './AdminLinkedAccounts'
import type { AdminUser } from '@/types/user'

jest.mock('@/components/ra-logo/RaLogo', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/steam-logo/SteamLogo', () => ({ __esModule: true, default: () => null }))

const BOB = {
  id: 11, username: 'bob', email: null, theme: 'dark', avatar: null, admin: false,
  rausername: null, ra_display: null, location: null, steamid: null, steamusername: null,
} as AdminUser

const respond = (ok: boolean, body: unknown) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(body) })

beforeEach(() => {
  global.fetch = jest.fn()
})

test('links RA with the username and key, and reports the change', async () => {
  respond(true, { ok: true, rausername: 'BobRA', ra_display: 'BobRA' })
  const onUpdated = jest.fn()
  render(<AdminLinkedAccounts user={BOB} onUpdated={onUpdated} />)

  fireEvent.change(screen.getByLabelText('RA username'), { target: { value: 'bobra' } })
  fireEvent.change(screen.getByLabelText('RA Web API key'), { target: { value: 'key' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Link' })[0])

  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, { rausername: 'BobRA', ra_display: 'BobRA' }))
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/accounts', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ id: 11, platform: 'ra', username: 'bobra', apiKey: 'key' }),
  }))
})

test('an RA refusal is explained', async () => {
  respond(false, { error: 'ra-invalid' })
  render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
  fireEvent.change(screen.getByLabelText('RA username'), { target: { value: 'bob' } })
  fireEvent.change(screen.getByLabelText('RA Web API key'), { target: { value: 'bad' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Link' })[0])
  expect(await screen.findByRole('alert')).toHaveTextContent('RA refused that username or key')
})

test('links Steam from an ID', async () => {
  respond(true, { ok: true, steamid: '76561198000000000', steamusername: 'Bobby' })
  const onUpdated = jest.fn()
  render(<AdminLinkedAccounts user={BOB} onUpdated={onUpdated} />)
  fireEvent.change(screen.getByLabelText('SteamID64 or profile link'), { target: { value: '76561198000000000' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Link' })[1])
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, { steamid: '76561198000000000', steamusername: 'Bobby' }))
})

test('unlinks what is linked', async () => {
  respond(true, { ok: true })
  const onUpdated = jest.fn()
  render(<AdminLinkedAccounts user={{ ...BOB, rausername: 'BobRA', steamid: '76561198000000000', steamusername: 'Bobby' }} onUpdated={onUpdated} />)

  expect(screen.queryByLabelText('RA username')).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Unlink' })[1])
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, { steamid: null, steamusername: null }))
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/accounts?id=11&platform=steam', { method: 'DELETE' })
})

test('Link stays disabled until there is something to link', () => {
  render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
  for (const button of screen.getAllByRole('button', { name: 'Link' })) expect(button).toBeDisabled()
})

test('links PSN from an online ID', async () => {
  respond(true, { ok: true, psnaccountid: '123', psnusername: 'BobPS' })
  const onUpdated = jest.fn()
  render(<AdminLinkedAccounts user={BOB} onUpdated={onUpdated} />)
  fireEvent.change(screen.getByLabelText('PSN online ID'), { target: { value: 'BobPS' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Link' })[2])
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, { psnaccountid: '123', psnusername: 'BobPS' }))
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/accounts', expect.objectContaining({
    body: JSON.stringify({ id: 11, platform: 'psn', username: 'BobPS' }),
  }))
})

test('a private PSN profile is explained', async () => {
  respond(false, { error: 'private' })
  render(<AdminLinkedAccounts user={BOB} onUpdated={jest.fn()} />)
  fireEvent.change(screen.getByLabelText('PSN online ID'), { target: { value: 'BobPS' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Link' })[2])
  expect(await screen.findByRole('alert')).toHaveTextContent('keeps its trophies private')
})

test('unlinks PSN', async () => {
  respond(true, { ok: true })
  const onUpdated = jest.fn()
  render(<AdminLinkedAccounts user={{ ...BOB, psnaccountid: '123', psnusername: 'BobPS' }} onUpdated={onUpdated} />)
  fireEvent.click(screen.getByRole('button', { name: 'Unlink' }))
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, { psnaccountid: null, psnusername: null }))
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/accounts?id=11&platform=psn', { method: 'DELETE' })
})
