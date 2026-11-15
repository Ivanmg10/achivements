import { render, screen } from '@testing-library/react'
import CursorTooltip from './CursorTooltip'

test('is a tooltip on the body, beside the pointer, never in the flow of its caller', () => {
  const { container } = render(<section><CursorTooltip x={100} y={200}><p>Title</p></CursorTooltip></section>)
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent('Title')
  expect(container.contains(tip)).toBe(false)
  expect(tip.parentElement).toBe(document.body)
  expect(tip).toHaveStyle({ left: '114px', top: '190px' })
  expect(tip).toHaveClass('pointer-events-none', 'fixed')
})
