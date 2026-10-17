import { render, screen } from '@testing-library/react'
import FaqList from './FaqList'

const items = [
  { q: 'Is it free?', a: 'Yes.' },
  { q: 'Which platforms?', a: 'Three.' },
]

test('shows the title, the lead and every question, with the answers already in the page', () => {
  render(<FaqList title="FAQ" lead="What people ask." items={items} />)
  expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument()
  expect(screen.getByText('What people ask.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Is it free\?/ })).toBeInTheDocument()
  expect(screen.getByText('Three.')).toBeInTheDocument()
})

test('numbers the questions in order', () => {
  render(<FaqList title="FAQ" items={items} />)
  expect(screen.getByText('01')).toBeInTheDocument()
  expect(screen.getByText('02')).toBeInTheDocument()
})
