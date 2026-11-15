import { render, screen } from '@testing-library/react'
import FaqList from './FaqList'

const items = [
  { q: 'Is it free?', a: 'Yes.' },
  { q: 'Which platforms?', a: 'Three.' },
]

test('shows the title and every question, with the answers already in the page and no numbers', () => {
  render(<FaqList title="FAQ" items={items} />)
  expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Is it free\?/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Which platforms\?/ })).toBeInTheDocument()
  expect(screen.getByText('Three.')).toBeInTheDocument()
  expect(screen.queryByText('01')).not.toBeInTheDocument()
})
