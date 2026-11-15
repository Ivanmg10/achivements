import { fireEvent, render, screen } from '@testing-library/react'
import DeleteAccountCard from './DeleteAccountCard'
import { en } from '@/translations/en'

test('explains what deleting does, and opens the confirmation on demand', async () => {
  render(<DeleteAccountCard />)
  expect(screen.getByText(en.deleteAccount.text)).toBeInTheDocument()
  expect(screen.queryByLabelText(en.deleteAccount.password)).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.deleteAccount.button }))
  expect(await screen.findByLabelText(en.deleteAccount.password)).toBeInTheDocument()
})
