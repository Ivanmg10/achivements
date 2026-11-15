import { fireEvent, render, screen } from '@testing-library/react'
import AdminPsnVerification from './AdminPsnVerification'

test('says it is verified and clears it on request', () => {
  const onClear = jest.fn()
  render(<AdminPsnVerification busy={false} onClear={onClear} />)
  expect(screen.getByText('Verified')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Clear verification' }))
  expect(onClear).toHaveBeenCalledTimes(1)
})

test('cannot be pressed while something else is being saved', () => {
  render(<AdminPsnVerification busy onClear={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Clear verification' })).toBeDisabled()
})
