import { render } from '@testing-library/react'
import DateText from './DateText'

test('the one format, as a time a machine can read', () => {
  const { container } = render(<DateText value="2026-10-13 18:30:00" />)
  const time = container.querySelector('time')!
  expect(time).toHaveAttribute('dateTime', '2026-10-13T18:30:00.000Z')
  expect(time.textContent).toBe('Oct 13, 2026')
})

test('nothing without a date', () => {
  expect(render(<DateText value={null} />).container).toBeEmptyDOMElement()
  expect(render(<DateText value="nope" />).container).toBeEmptyDOMElement()
})
