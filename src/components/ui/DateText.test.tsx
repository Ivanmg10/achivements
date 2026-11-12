import { render } from '@testing-library/react'
import DateText from './DateText'

beforeEach(() => jest.useFakeTimers({ now: Date.parse('2026-11-11T12:00:00Z') }))
afterEach(() => jest.useRealTimers())

test('the one format, as a time a machine can read: no year this year', () => {
  const { container } = render(<DateText value="2026-10-13 18:30:00" />)
  const time = container.querySelector('time')!
  expect(time).toHaveAttribute('dateTime', '2026-10-13T18:30:00.000Z')
  expect(time.textContent).toBe('Oct 13')
})

test('the year when it is another one', () => {
  const { container } = render(<DateText value="2025-10-13 18:30:00" />)
  expect(container.querySelector('time')!.textContent).toBe('Oct 13, 2025')
})

test('nothing without a date', () => {
  expect(render(<DateText value={null} />).container).toBeEmptyDOMElement()
  expect(render(<DateText value="nope" />).container).toBeEmptyDOMElement()
})
