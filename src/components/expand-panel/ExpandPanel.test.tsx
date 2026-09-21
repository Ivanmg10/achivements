import { render, screen, waitFor } from '@testing-library/react'
import ExpandPanel from './ExpandPanel'

test('renders its content with the given id while open', () => {
  render(<ExpandPanel open id="p" className="border-t"><p>content</p></ExpandPanel>)
  const content = screen.getByText('content')
  expect(content.parentElement?.id).toBe('p')
  expect(content.parentElement?.className).toContain('border-t')
})

test('renders nothing while closed', () => {
  render(<ExpandPanel open={false}><p>content</p></ExpandPanel>)
  expect(screen.queryByText('content')).not.toBeInTheDocument()
})

test('removes its content once closed', async () => {
  const { rerender } = render(<ExpandPanel open><p>content</p></ExpandPanel>)
  rerender(<ExpandPanel open={false}><p>content</p></ExpandPanel>)
  // Framer Motion is mocked in tests, so there is no exit animation to wait for.
  await waitFor(() => expect(screen.queryByText('content')).not.toBeInTheDocument())
})
