import { fireEvent, render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import WelcomePagePrivacy from './WelcomePagePrivacy'

const mockVault = jest.fn()
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: () => ({ me: mockVault(), setShowInRankings: jest.fn() }) }))

const T = en.welcome

function renderStep() {
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePagePrivacy {...props} direction="none" focusTitle={false} />)
  return props
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVault.mockReturnValue({ showInRankings: false, rank: 0 })
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', T: en })
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'ana', profilePublic: true, showPresence: false } }, update: jest.fn() })
})

test('the three switches of the account page, with what the account has', () => {
  renderStep()
  expect(screen.getByRole('switch', { name: en.userData.profilePublic })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('switch', { name: en.userData.showPresence })).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByRole('switch', { name: en.rankings.showInRankings })).toHaveAttribute('aria-checked', 'false')
})

test('the rankings switch holds its row while the points are read', () => {
  mockVault.mockReturnValue(null)
  renderStep()
  expect(screen.getByRole('switch', { name: en.rankings.showInRankings })).toHaveAttribute('aria-checked', 'true')
})

test('next and skip', () => {
  const { onNext, onSkip } = renderStep()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${T.next}`) }))
  fireEvent.click(screen.getByRole('button', { name: T.skipStep }))
  expect(onNext).toHaveBeenCalled()
  expect(onSkip).toHaveBeenCalled()
})
