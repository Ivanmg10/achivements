import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import UserProfileSwitch from './UserProfileSwitch'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const update = jest.fn()
const sent = () => JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
const renderSwitch = (checked: boolean) =>
  render(<UserProfileSwitch field="profilePublic" checked={checked} label="Public profile" onText="Anyone" offText="Only you" icon={null} />)

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update })
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

test('on says so in words', () => {
  renderSwitch(true)
  expect(screen.getByRole('switch', { name: 'Public profile' })).toBeChecked()
  expect(screen.getByText('Anyone')).toBeInTheDocument()
})

test('off says so in words', () => {
  renderSwitch(false)
  expect(screen.getByRole('switch')).not.toBeChecked()
  expect(screen.getByText('Only you')).toBeInTheDocument()
})

test('turning it off saves "false", and turning it on saves "true"', async () => {
  const { unmount } = renderSwitch(true)
  fireEvent.click(screen.getByRole('switch'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'profilePublic', value: 'false' })
  unmount()

  ;(global.fetch as jest.Mock).mockClear()
  renderSwitch(false)
  fireEvent.click(screen.getByRole('switch'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(sent()).toEqual({ field: 'profilePublic', value: 'true' })
})

test('a failed save shows the error next to the switch', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Nope' }) })
  renderSwitch(true)
  fireEvent.click(screen.getByRole('switch'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Nope')
})
