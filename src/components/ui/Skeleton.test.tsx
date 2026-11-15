import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

const block = (el: React.ReactElement) => render(el).container.firstElementChild!

test('pulses unless reduced motion is asked for, and is hidden from assistive tech', () => {
  const el = block(<Skeleton />)
  expect(el).toHaveClass('bg-skeleton', 'animate-pulse', 'motion-reduce:animate-none')
  expect(el).toHaveAttribute('aria-hidden', 'true')
})

test('takes its radius from the design tokens', () => {
  expect(block(<Skeleton />)).toHaveClass('rounded-tag')
  expect(block(<Skeleton radius="card" />)).toHaveClass('rounded-card')
  expect(block(<Skeleton radius="circle" />)).toHaveClass('rounded-full')
})

test('is sized by the caller', () => {
  const el = block(<Skeleton className="h-4 w-1/2" style={{ width: '3rem' }} />)
  expect(el).toHaveClass('h-4', 'w-1/2')
  expect(el).toHaveStyle({ width: '3rem' })
})
