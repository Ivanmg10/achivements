import { render, screen } from '@testing-library/react'
import Notice from './Notice'

it('announces an error, tinted in the danger colour', () => {
  render(<Notice tone="danger">Wrong password</Notice>)
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Wrong password')
  expect(alert.className).toContain('bg-danger/10')
})

it('a warning can be announced too, and a small one fits a line in a card', () => {
  render(<Notice tone="warning" alert size="sm">Your key stopped working</Notice>)
  const alert = screen.getByRole('alert')
  expect(alert).toHaveClass('text-xs', 'rounded-box')
})

it('says the rest politely, with a title and an action', () => {
  render(<Notice tone="success" title="Saved" action={<button>Undo</button>}>Your profile is public now</Notice>)
  expect(screen.getByRole('status')).toHaveTextContent('Saved')
  expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
})
