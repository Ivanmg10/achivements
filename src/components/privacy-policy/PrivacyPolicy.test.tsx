import { render, screen } from '@testing-library/react'
import PrivacyPolicy from './PrivacyPolicy'
import { en } from '@/translations/en'

jest.mock('@/lib/siteUrl', () => ({ CONTACT_EMAIL: '', DATA_CONTROLLER: 'Iván Márquez García' }))
const mockSite = jest.requireMock('@/lib/siteUrl') as { CONTACT_EMAIL: string }

beforeEach(() => {
  mockSite.CONTACT_EMAIL = ''
})

test('shows every section of the policy', () => {
  render(<PrivacyPolicy />)
  expect(screen.getByRole('heading', { level: 1, name: en.privacy.title })).toBeInTheDocument()
  for (const section of en.privacy.sections) {
    expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
  }
  expect(screen.getByRole('link', { name: en.privacy.back })).toHaveAttribute('href', '/')
})

test('names who is responsible for the data', () => {
  render(<PrivacyPolicy />)
  expect(screen.getByText(`${en.privacy.controller}:`)).toBeInTheDocument()
  expect(screen.getByText('Iván Márquez García')).toBeInTheDocument()
})

test('gives the contact address as a mail link when one is set', () => {
  mockSite.CONTACT_EMAIL = 'privacy@test.com'
  render(<PrivacyPolicy />)
  expect(screen.getByRole('link', { name: 'privacy@test.com' })).toHaveAttribute('href', 'mailto:privacy@test.com')
})

test('says nothing about contact when no address is configured', () => {
  render(<PrivacyPolicy />)
  expect(screen.queryByText(`${en.privacy.contact}:`)).not.toBeInTheDocument()
})
