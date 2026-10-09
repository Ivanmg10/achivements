import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import UserProfilePublicToggle from './UserProfilePublicToggle'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const update = jest.fn()
const setUser = (user: Record<string, unknown>) => (useSession as jest.Mock).mockReturnValue({ data: { user }, update })
const sent = () => JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

test('on by default, and says so in words', () => {
  setUser({})
  render(<UserProfilePublicToggle />)
  expect(screen.getByRole('switch', { name: en.userData.profilePublic })).toBeChecked()
  expect(screen.getByText(en.userData.profilePublicOn)).toBeInTheDocument()
})

test('off when the profile is private, and says so in words', () => {
  setUser({ profilePublic: false })
  render(<UserProfilePublicToggle />)
  expect(screen.getByRole('switch')).not.toBeChecked()
  expect(screen.getByText(en.userData.profilePublicOff)).toBeInTheDocument()
})

test('turning it off saves "false", and turning it on saves "true"', async () => {
  setUser({ profilePublic: true })
  const { unmount } = render(<UserProfilePublicToggle />)
  fireEvent.click(screen.getByRole('switch'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'profilePublic', value: 'false' })
  unmount()

  ;(global.fetch as jest.Mock).mockClear()
  setUser({ profilePublic: false })
  render(<UserProfilePublicToggle />)
  fireEvent.click(screen.getByRole('switch'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'profilePublic', value: 'true' })
})

test('a failed save shows the error next to the switch', async () => {
  setUser({})
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Nope' }) })
  render(<UserProfilePublicToggle />)
  fireEvent.click(screen.getByRole('switch'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Nope')
})
