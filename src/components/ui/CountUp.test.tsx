import { render, screen } from '@testing-library/react'
import { CountUp } from './CountUp'

jest.mock('framer-motion', () => ({
  animate: jest.fn(() => ({ stop: jest.fn() })),
  useReducedMotion: jest.fn(() => false),
}))

const { animate, useReducedMotion } = jest.requireMock('framer-motion')

beforeEach(() => jest.clearAllMocks())

test('the real value is in the markup from the start', () => {
  render(<CountUp value={1234} />)
  expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument()
})

test('animates from zero up to the value', () => {
  render(<CountUp value={42} />)
  expect(animate).toHaveBeenCalledWith(0, 42, expect.objectContaining({ duration: 0.9 }))
})

test('a number with words around it keeps them, in the markup and while it counts', () => {
  render(<CountUp value={12} format={(n) => `${n} days`} />)
  expect(screen.getByText('12 days')).toBeInTheDocument()
  animate.mock.calls[0][2].onUpdate(6.4)
  expect(screen.getByText('6 days')).toBeInTheDocument()
})

test('does not animate when the user asks for less motion', () => {
  useReducedMotion.mockReturnValue(true)
  render(<CountUp value={42} />)
  expect(animate).not.toHaveBeenCalled()
  expect(screen.getByText('42')).toBeInTheDocument()
})
