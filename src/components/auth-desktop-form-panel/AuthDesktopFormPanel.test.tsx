import { render, screen } from '@testing-library/react'
import AuthDesktopFormPanel from './AuthDesktopFormPanel'

test('puts the brand over the form', () => {
  render(
    <AuthDesktopFormPanel>
      <form aria-label="Sign in" />
    </AuthDesktopFormPanel>,
  )
  const brand = screen.getByText('CheevoVault')
  const form = screen.getByRole('form', { name: 'Sign in' })
  expect(brand.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
