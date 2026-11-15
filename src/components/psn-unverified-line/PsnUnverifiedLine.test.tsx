import { render, screen } from '@testing-library/react'
import PsnUnverifiedLine from './PsnUnverifiedLine'
import { en } from '@/translations/en'

test('as a notice it says it and leads to the account page', () => {
  render(<PsnUnverifiedLine action />)
  expect(screen.getByRole('status')).toHaveTextContent(en.psn.verification.vaultLine)
  expect(screen.getByRole('link', { name: en.psn.verification.vaultAction })).toHaveAttribute('href', '/user')
})

test('as a line (inside a card that is a link) it is text only, with no second link', () => {
  render(<PsnUnverifiedLine />)
  expect(screen.getByText(en.psn.verification.vaultLine)).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
