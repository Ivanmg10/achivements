import { fireEvent, render, screen } from '@testing-library/react'
import AdminUnlockRecovery from './AdminUnlockRecovery'

test('shows every code, and goes on when they are saved', () => {
  const onDone = jest.fn()
  render(<AdminUnlockRecovery codes={['abcde-12345', 'fghij-67890']} onDone={onDone} />)
  expect(screen.getByText('abcde-12345')).toBeInTheDocument()
  expect(screen.getByText('fghij-67890')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'I have saved them' }))
  expect(onDone).toHaveBeenCalled()
})
