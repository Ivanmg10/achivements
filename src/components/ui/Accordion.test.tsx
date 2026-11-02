import { render, screen, fireEvent } from '@testing-library/react'
import AccordionItem from './Accordion'

test('the answer is in the page while closed, but not reachable', () => {
  render(<AccordionItem title="What is it?">An answer.</AccordionItem>)
  const button = screen.getByRole('button', { name: 'What is it?' })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  const panel = document.getElementById(button.getAttribute('aria-controls')!)!
  expect(panel).toHaveTextContent('An answer.')
  expect(panel).toHaveAttribute('inert')
})

test('opens and closes, each item on its own', () => {
  render(<><AccordionItem title="One">First.</AccordionItem><AccordionItem title="Two">Second.</AccordionItem></>)
  fireEvent.click(screen.getByRole('button', { name: 'One' }))
  expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'One' }))
  expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'false')
})

test('can start open, and numbers itself only when it is given a place', () => {
  const { rerender } = render(<AccordionItem title="Q" index={2} defaultOpen>A</AccordionItem>)
  expect(screen.getByRole('button', { name: /Q/ })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('03')).toBeInTheDocument()
  rerender(<AccordionItem title="Q" defaultOpen>A</AccordionItem>)
  expect(screen.queryByText('03')).not.toBeInTheDocument()
})
