import { render, screen } from '@testing-library/react'
import Notice from './Notice'

it('announces an error, tinted in the danger colour', () => {
  render(<Notice tone="danger">Wrong password</Notice>)
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Wrong password')
  expect(alert.className).toContain('bg-danger/10')
})

it('says the rest politely, with a title and an action', () => {
  render(<Notice tone="success" title="Saved" action={<button>Undo</button>}>Your profile is public now</Notice>)
  expect(screen.getByRole('status')).toHaveTextContent('Saved')
  expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
})
