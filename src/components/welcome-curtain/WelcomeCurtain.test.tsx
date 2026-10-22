import { act, render, screen } from '@testing-library/react'
import WelcomeCurtain from './WelcomeCurtain'

const from = { label: 'Account', mark: <span>A</span>, sky: 'red' }
const to = { label: 'Welcome', mark: <span>W</span>, sky: 'blue' }

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('decorative: both ends and the word, to no one', () => {
  const { container } = render(<WelcomeCurtain from={from} to={to} word="WELCOME" />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText('Account')).toBeInTheDocument()
  expect(screen.getByText('Welcome')).toBeInTheDocument()
  expect(screen.getAllByText(/WELCOME/).length).toBe(2)
})

test('picked up part way: the offset becomes a negative delay', () => {
  const { container } = render(<WelcomeCurtain from={from} to={to} word="W" offsetMs={1100} />)
  expect((container.firstChild as HTMLElement).style.getPropertyValue('--curtain-offset')).toBe('-1100ms')
})

test('held once it covers the screen', () => {
  const { container } = render(<WelcomeCurtain from={from} to={to} word="W" holdAtMs={1100} />)
  expect(container.firstChild).not.toHaveAttribute('data-held')
  act(() => jest.advanceTimersByTime(1100))
  expect(container.firstChild).toHaveAttribute('data-held', 'true')
})

test('going back, the end reached is on the left', () => {
  render(<WelcomeCurtain from={from} to={to} word="W" direction="back" />)
  expect((screen.getByText('Welcome').parentElement as HTMLElement).style.left).toBe('32%')
})
