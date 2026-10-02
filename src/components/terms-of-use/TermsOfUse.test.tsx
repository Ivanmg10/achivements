import { render, screen } from '@testing-library/react'
import TermsOfUse from './TermsOfUse'
import { en } from '@/translations/en'

jest.mock('@/lib/siteUrl', () => ({ CONTACT_EMAIL: 'privacy@test.com', DATA_CONTROLLER: 'Iván Márquez García' }))

test('shows every section of the terms, and who answers for them', () => {
  render(<TermsOfUse />)
  expect(screen.getByRole('heading', { level: 1, name: en.terms.title })).toBeInTheDocument()
  for (const section of en.terms.sections) {
    expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
  }
  expect(screen.getByText('Iván Márquez García')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'privacy@test.com' })).toHaveAttribute('href', 'mailto:privacy@test.com')
})
