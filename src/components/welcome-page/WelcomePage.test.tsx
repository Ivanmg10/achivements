import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { en } from '@/translations/en'
import { forgetUnsavedValues } from '@/hooks/useStorageValue'
import { CURTAIN_MS } from '@/hooks/useWelcomeSteps'
import WelcomePage from './WelcomePage'

jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark', setTheme: jest.fn() }) }))
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: () => ({ me: null, setShowInRankings: jest.fn() }) }))

const T = en.welcome

function signedIn(user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'ivan', ...user } }, status: 'authenticated', update: jest.fn() })
}

/** Presses a button and lets the curtain pass. */
function press(name: string | RegExp) {
  fireEvent.click(screen.getAllByRole('button', { name })[0])
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
}

const bar = () => screen.getByRole('navigation', { name: T.stepsLabel })

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  sessionStorage.clear()
  forgetUnsavedValues()
  window.history.replaceState(null, '', '/welcome')
  signedIn()
})
afterEach(() => jest.useRealTimers())

test('opens on the welcome, with the eight steps along the top', () => {
  render(<WelcomePage />)
  expect(screen.getByRole('heading', { level: 1, name: T.intro.title })).toBeInTheDocument()
  const pills = within(bar()).getAllByRole('button')
  expect(pills).toHaveLength(8)
  expect(pills[0]).toHaveAttribute('aria-current', 'step')
  // Not reached yet: cannot be jumped to.
  expect(pills[3]).toBeDisabled()
  for (const perk of T.intro.perks) expect(screen.getByText(perk.title)).toBeInTheDocument()
})

test('moves under the curtain, and the new step takes the focus', () => {
  render(<WelcomePage />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.start) }))
  // The curtain says nothing to a screen reader; the old step is still under it.
  expect(screen.getByRole('heading', { level: 1, name: T.intro.title })).toBeInTheDocument()
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  const title = screen.getByRole('heading', { level: 1, name: T.steps.ra })
  expect(title).toHaveFocus()
  expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 8')
})

test('"not now" leaves a platform for later, and back returns to it', () => {
  render(<WelcomePage />)
  press(new RegExp(T.start))
  press(T.notNow)
  expect(screen.getByRole('heading', { level: 1, name: T.steps.steam })).toBeInTheDocument()
  expect(within(bar()).getByRole('button', { name: `${T.steps.ra}, ${T.state.later}` })).toBeInTheDocument()
  expect(within(bar()).getByRole('button', { name: `${T.steps.intro}, ${T.state.done}` })).toBeInTheDocument()

  press(T.back)
  expect(screen.getByRole('heading', { level: 1, name: T.steps.ra })).toBeInTheDocument()
})

test('any step already seen can be jumped to from the bar', () => {
  render(<WelcomePage />)
  press(new RegExp(T.start))
  press(T.notNow)
  press(`${T.steps.intro}, ${T.state.done}`)
  expect(screen.getByRole('heading', { level: 1, name: T.intro.title })).toBeInTheDocument()
})

test('a linked platform shows its logo in the bar and offers to go on', () => {
  signedIn({ steamid: '765', steamusername: 'gabe' })
  sessionStorage.setItem('welcome-progress', JSON.stringify({ step: 2, seen: 2, skipped: [] }))
  render(<WelcomePage />)
  expect(screen.getByText(T.steam.linked)).toBeInTheDocument()
  expect(screen.getByText('gabe')).toBeInTheDocument()
  press(new RegExp(`^${T.next}`))
  expect(screen.getByRole('heading', { level: 1, name: T.steps.psn })).toBeInTheDocument()
  expect(within(bar()).getByRole('button', { name: `${T.steps.steam}, ${T.state.linked}` })).toBeInTheDocument()
})

test('skip all goes to the end, and the way in forgets the welcome', () => {
  render(<WelcomePage />)
  press(T.skipAll)
  expect(screen.getByRole('heading', { level: 1, name: T.done.titleNone })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.goToVault) }))
  expect(useRouter().push).toHaveBeenCalledWith('/')
  expect(sessionStorage.getItem('welcome-progress')).toBeNull()
})

test('the end sends each thing left for later back to its step', () => {
  sessionStorage.setItem('welcome-progress', JSON.stringify({ step: 7, seen: 7, skipped: ['ra'] }))
  render(<WelcomePage />)
  press(`${T.done.connect}: ${T.steps.ra}`)
  expect(screen.getByRole('heading', { level: 1, name: T.steps.ra })).toBeInTheDocument()
})

test('privacy comes after the style, each a step of its own, and the end leads back to it', () => {
  sessionStorage.setItem('welcome-progress', JSON.stringify({ step: 5, seen: 5, skipped: [] }))
  render(<WelcomePage />)
  expect(screen.getByRole('heading', { level: 1, name: T.prefs.title })).toBeInTheDocument()
  press(T.next)
  expect(screen.getByRole('heading', { level: 1, name: T.privacy.title })).toBeInTheDocument()
  press(T.next)
  press(`${T.done.edit}: ${T.steps.privacy}`)
  expect(screen.getByRole('heading', { level: 1, name: T.privacy.title })).toBeInTheDocument()
})

test('says the giant word behind the step to no one', () => {
  const { container } = render(<WelcomePage />)
  const word = container.querySelector('[aria-hidden="true"]')
  expect(word).toHaveTextContent(T.words.intro)
})

test('fresh from sign-up, the curtain that started there finishes here', () => {
  sessionStorage.setItem('welcome-entry', '1')
  render(<WelcomePage />)
  expect(screen.getByText(T.account)).toBeInTheDocument()
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  expect(screen.queryByText(T.account)).toBeNull()
  expect(sessionStorage.getItem('welcome-entry')).toBeNull()
})
