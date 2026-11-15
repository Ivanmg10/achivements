import { fireEvent, render, screen, within } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import WelcomePageProfile from './WelcomePageProfile'

const T = en.welcome

function renderStep(user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'ivan', ...user } }, update: jest.fn() })
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePageProfile {...props} direction="forward" focusTitle={false} />)
  return props
}

beforeEach(() => jest.clearAllMocks())

test('the account page’s fields, with nothing set yet', () => {
  renderStep()
  expect(screen.getByRole('button', { name: `${T.profile.photo}: ${en.userData.notSet}` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userData.location}: ${en.userData.notSet}` })).toBeInTheDocument()
  expect(screen.getByLabelText(en.userData.description)).toBeInTheDocument()
  // No gender, so nothing to show or hide yet.
  expect(screen.queryByRole('switch')).toBeNull()
})

test('each field opens its picker', async () => {
  renderStep()
  fireEvent.click(screen.getByRole('button', { name: `${en.userData.location}: ${en.userData.notSet}` }))
  expect(await screen.findByPlaceholderText(/./)).toBeInTheDocument()
})

test('with a gender set, whether it shows on the profile', () => {
  renderStep({ gender: 'female', genderPublic: true, location: 'ES' })
  expect(screen.getByRole('switch', { name: en.userData.genderPublic })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('button', { name: `${en.userData.location}: Spain` })).toBeInTheDocument()
})

test('the preview follows the profile: country, public gender, a long description that wraps', () => {
  const long = 'x'.repeat(200)
  renderStep({ gender: 'female', genderPublic: true, location: 'ES', description: long })
  const preview = screen.getByRole('complementary', { name: T.profile.preview })
  expect(preview).toHaveTextContent('Spain')
  expect(preview).toHaveTextContent(en.userData.genderFemale)
  const text = within(preview).getByText(long)
  expect(text.className).toContain('[overflow-wrap:anywhere]')
  expect(text.className).toContain('line-clamp-4')
})

test('an empty preview says so', () => {
  renderStep()
  expect(screen.getByText(T.profile.noCountry)).toBeInTheDocument()
  expect(screen.getByText(T.profile.noDescription)).toBeInTheDocument()
})

test('next, skip and back', () => {
  const { onNext, onSkip, onBack } = renderStep()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${T.next}`) }))
  fireEvent.click(screen.getByRole('button', { name: T.skipStep }))
  fireEvent.click(screen.getByRole('button', { name: T.back }))
  expect(onNext).toHaveBeenCalled()
  expect(onSkip).toHaveBeenCalled()
  expect(onBack).toHaveBeenCalled()
})
