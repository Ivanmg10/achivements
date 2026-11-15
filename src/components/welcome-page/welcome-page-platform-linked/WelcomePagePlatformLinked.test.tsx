import { render, screen } from '@testing-library/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import WelcomePagePlatformLinked from './WelcomePagePlatformLinked'

const mockFill = jest.fn()
jest.mock('@/context/VaultFillContext', () => ({ useVaultFillState: () => mockFill() }))

beforeEach(() => {
  mockFill.mockReturnValue(null)
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', T: en })
})

test('says the account and that it is linked in words, not only with a tick', () => {
  render(<WelcomePagePlatformLinked platform="psn" name="kratos" mark={<span />} />)
  expect(screen.getByText('kratos')).toBeInTheDocument()
  expect(screen.getByText(en.welcome.done.linked)).toBeInTheDocument()
})

test('shows the platform’s picture when there is one', () => {
  const { container } = render(<WelcomePagePlatformLinked platform="steam" name="gabe" mark={<span />} picture="https://example.com/a.jpg" />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.jpg')
})

test('carries how the reading of its games goes', () => {
  mockFill.mockReturnValue({ status: { platforms: { ra: { state: 'done', read: 188, total: 190, skipped: 2 } } } })
  render(<WelcomePagePlatformLinked platform="ra" name="ana" mark={<span />} />)
  expect(screen.getByText(en.rankings.fillCounted.replace('{n}', '188'))).toBeInTheDocument()
})
