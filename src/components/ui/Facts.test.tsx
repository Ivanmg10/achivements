import { render } from '@testing-library/react'
import Facts from './Facts'

test('joins the facts with the mark, hidden from a screen reader, which hears a comma', () => {
  const { container } = render(<p><Facts items={['PS4', '33 of 51 trophies', '11 h ago']} /></p>)
  const marks = container.querySelectorAll('[aria-hidden="true"]')
  expect(marks).toHaveLength(2)
  expect(marks[0]).toHaveClass('before:content-(--mark)', 'text-accent')
  expect(container.textContent).toBe('PS4, 33 of 51 trophies, 11 h ago')
})

test('leaves out empty facts with their mark', () => {
  const { container } = render(<p><Facts items={[null, 'Steam', false, '', <b key="h">12 h</b>]} /></p>)
  expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  expect(container.textContent).toBe('Steam, 12 h')
})

test('one fact has no mark', () => {
  const { container } = render(<p><Facts items={['Steam']} /></p>)
  expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
})
