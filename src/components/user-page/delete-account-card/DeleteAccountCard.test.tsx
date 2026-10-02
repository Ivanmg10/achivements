import { fireEvent, render, screen } from '@testing-library/react'
import DeleteAccountCard from './DeleteAccountCard'
import { en } from '@/translations/en'

test('explains what deleting does, and opens the confirmation on demand', () => {
  render(<DeleteAccountCard />)
  expect(screen.getByText(en.deleteAccount.text)).toBeInTheDocument()
  expect(screen.queryByLabelText(en.deleteAccount.password)).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.deleteAccount.button }))
  expect(screen.getByLabelText(en.deleteAccount.password)).toBeInTheDocument()
})
