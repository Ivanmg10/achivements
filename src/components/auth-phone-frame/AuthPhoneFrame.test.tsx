import { render, screen } from '@testing-library/react'
import AuthPhoneFrame from './AuthPhoneFrame'

jest.mock('@/components/auth-collage-panel/AuthCollagePanel', () => ({ __esModule: true, default: () => <div data-testid="wall" /> }))

test('a band of covers on top, then the name, then the form', () => {
  render(<AuthPhoneFrame><form aria-label="Sign in" /></AuthPhoneFrame>)
  const wall = screen.getByTestId('wall')
  const name = screen.getByText('CheevoVault')
  const form = screen.getByRole('form', { name: 'Sign in' })
  expect(wall.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(name.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
