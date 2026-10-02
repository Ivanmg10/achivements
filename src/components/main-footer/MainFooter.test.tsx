import { render, screen } from '@testing-library/react'
import MainFooter from './MainFooter'
import { en } from '@/translations/en'

jest.mock('@/lib/analytics', () => ({ GA_ID: '', setAnalyticsEnabled: jest.fn() }))

test('renders footer brand name and the current year', () => {
  render(<MainFooter />)
  expect(screen.getByText('CheevoVault')).toBeInTheDocument()
  expect(screen.getByText(`© ${new Date().getFullYear()}`)).toBeInTheDocument()
})

test('links to both platforms it tracks, Steam included', () => {
  render(<MainFooter />)
  expect(screen.getByText(en.mainFooter.poweredBy)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'RetroAchievements' })).toHaveAttribute('href', 'https://retroachievements.org')
  expect(screen.getByRole('link', { name: 'Steam' })).toHaveAttribute('href', 'https://store.steampowered.com')
})

test('links to the repository and the privacy policy', () => {
  render(<MainFooter />)
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Ivanmg10/achivements')
  expect(screen.getByRole('link', { name: en.privacy.link })).toHaveAttribute('href', '/privacy')
})
