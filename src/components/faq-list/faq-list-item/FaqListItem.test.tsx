import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FaqListItem from './FaqListItem'

const item = { q: 'Is it free?', a: 'Yes, all of it.' }

test('starts closed, with the answer in the page but out of reach', () => {
  render(<FaqListItem item={item} index={0} />)
  const button = screen.getByRole('button', { name: /Is it free\?/ })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  const panel = document.getElementById(button.getAttribute('aria-controls')!)!
  expect(panel).toHaveTextContent('Yes, all of it.')
  expect(panel).toHaveAttribute('inert')
})

test('opens and closes again from its button', async () => {
  render(<FaqListItem item={item} index={0} />)
  const button = screen.getByRole('button', { name: /Is it free\?/ })
  const panel = document.getElementById(button.getAttribute('aria-controls')!)!

  await userEvent.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
  expect(panel).not.toHaveAttribute('inert')

  await userEvent.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(panel).toHaveAttribute('inert')
})

test('the question is a heading, so it can be jumped to', () => {
  render(<FaqListItem item={item} index={2} />)
  expect(screen.getByRole('heading', { level: 3, name: /Is it free\?/ })).toBeInTheDocument()
  expect(screen.getByText('03')).toBeInTheDocument()
})
