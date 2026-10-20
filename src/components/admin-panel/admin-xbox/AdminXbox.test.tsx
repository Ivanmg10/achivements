jest.mock('@/hooks/useAdminXbox', () => ({ useAdminXbox: jest.fn() }))
jest.mock('./admin-xbox-game/AdminXboxGame', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <li>{game.title}</li>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import AdminXbox from './AdminXbox'
import { useAdminXbox } from '@/hooks/useAdminXbox'
import { xboxGameFixture, xboxProfileFixture } from '@/test-utils/xboxFixtures'

const lookup = jest.fn()

function set(overrides: Record<string, unknown> = {}) {
  ;(useAdminXbox as jest.Mock).mockReturnValue({ result: null, error: null, loading: false, lookup, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  set()
})

test('the button waits for a gamertag, and a lookup sends it trimmed', () => {
  render(<AdminXbox />)
  const button = screen.getByRole('button', { name: 'Look up' })
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByLabelText(/Gamertag/), { target: { value: '  TestPlayer ' } })
  expect(button).toBeEnabled()
  fireEvent.click(button)
  expect(lookup).toHaveBeenCalledWith('TestPlayer')
})

test('while looking up, it says so and cannot be sent twice', () => {
  set({ loading: true })
  render(<AdminXbox />)
  fireEvent.change(screen.getByLabelText(/Gamertag/), { target: { value: 'x' } })
  expect(screen.getByRole('button', { name: 'Looking up…' })).toBeDisabled()
})

test.each([
  ['not-found', /No Xbox account/],
  ['private', /hides its games/],
  ['not-configured', /OPENXBL_API_KEY is not set/],
  ['unauthorized', /refused the API key/],
  ['rate-limited', /hourly limit/],
  ['invalid-gamertag', /not a gamertag/],
  ['failed', /Could not reach OpenXBL/],
])('the %s error is announced next to the field', (error, text) => {
  set({ error })
  render(<AdminXbox />)
  expect(screen.getByRole('alert')).toHaveTextContent(text)
  expect(screen.getByLabelText(/Gamertag/)).toHaveAccessibleDescription(expect.stringMatching(text))
})

test('shows the profile, how many calls are left, and every game', () => {
  set({
    result: {
      profile: xboxProfileFixture({ gamerscore: 10242 }),
      games: [xboxGameFixture({ titleId: '1', title: 'One' }), xboxGameFixture({ titleId: '2', title: 'Two' })],
      rateLimit: { remaining: 140, limit: 150 },
    },
  })
  render(<AdminXbox />)
  expect(screen.getByText('TestPlayer')).toBeInTheDocument()
  expect(screen.getByText(/2 games/)).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('140 of 150')
  expect(screen.getByText('One')).toBeInTheDocument()
  expect(screen.getByText('Two')).toBeInTheDocument()
})

test('with no rate-limit reading, the line is left out', () => {
  set({ result: { profile: xboxProfileFixture(), games: [], rateLimit: null } })
  render(<AdminXbox />)
  expect(screen.queryByRole('status')).toBeNull()
})
