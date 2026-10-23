import { act, render, screen } from '@testing-library/react'
import WelcomeCurtain from './WelcomeCurtain'

const from = { label: 'Account', mark: <span>A</span>, sky: 'red' }
const to = { label: 'Welcome', mark: <span>W</span>, sky: 'blue' }

/** On <body>, not inside whatever renders it. */
const curtain = () => document.body.querySelector('[aria-hidden="true"].fixed') as HTMLElement

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('decorative: both ends and the word, to no one', () => {
  render(<WelcomeCurtain from={from} to={to} word="WELCOME" />)
  expect(curtain()).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText('Account')).toBeInTheDocument()
  expect(screen.getByText('Welcome')).toBeInTheDocument()
  expect(screen.getAllByText(/WELCOME/).length).toBe(2)
})

test('picked up part way: the offset becomes a negative delay', () => {
  render(<WelcomeCurtain from={from} to={to} word="W" offsetMs={1100} />)
  expect(curtain().style.getPropertyValue('--curtain-offset')).toBe('-1100ms')
})

test('held once it covers the screen', () => {
  render(<WelcomeCurtain from={from} to={to} word="W" holdAtMs={1100} />)
  expect(curtain()).not.toHaveAttribute('data-held')
  act(() => jest.advanceTimersByTime(1100))
  expect(curtain()).toHaveAttribute('data-held', 'true')
})

test('going back, the end reached is on the left', () => {
  render(<WelcomeCurtain from={from} to={to} word="W" direction="back" />)
  expect((screen.getByText('Welcome').parentElement as HTMLElement).style.left).toBe('32%')
})

test('covers the screen even inside a box that would trap a fixed element', () => {
  const { container } = render(
    <div style={{ transform: 'translateX(0)' }}>
      <WelcomeCurtain from={from} to={to} word="W" />
    </div>,
  )
  expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  expect(curtain().parentElement).toBe(document.body)
})
