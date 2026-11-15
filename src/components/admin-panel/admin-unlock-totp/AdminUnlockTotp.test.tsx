import { fireEvent, render, screen } from '@testing-library/react'
import AdminUnlockTotp from './AdminUnlockTotp'

test('asks for the code, and says a recovery code works too', () => {
  const onChange = jest.fn()
  render(<AdminUnlockTotp setup={null} code="" onChange={onChange} disabled={false} />)
  fireEvent.change(screen.getByLabelText(/Code from your authenticator/), { target: { value: '123456' } })
  expect(onChange).toHaveBeenCalledWith('123456')
  expect(screen.getByText('Or one of your recovery codes.')).toBeInTheDocument()
})

test('enrolling shows the key and a link for the app', () => {
  render(<AdminUnlockTotp setup={{ key: 'ABC234', uri: 'otpauth://totp/x' }} code="" onChange={jest.fn()} disabled={false} />)
  expect(screen.getByText('ABC234')).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveAttribute('href', 'otpauth://totp/x')
})
