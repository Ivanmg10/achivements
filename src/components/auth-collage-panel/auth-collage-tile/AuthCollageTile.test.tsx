import { render, screen } from '@testing-library/react'
import AuthCollageTile from './AuthCollageTile'
import { useMotionValue } from 'framer-motion'

function Harness(props: Partial<React.ComponentProps<typeof AuthCollageTile>>) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  return (
    <AuthCollageTile
      src="https://media.retroachievements.org/Images/000001.png"
      position={{ top: '1%', left: '2%', rotate: -5, z: 3 }}
      index={0}
      flipping={false}
      still={false}
      pointerX={x}
      pointerY={y}
      {...props}
    />
  )
}

test('draws the game art, hidden from assistive tech', () => {
  const { container } = render(<Harness />)
  const img = container.querySelector('img')!
  expect(img.getAttribute('src')).toContain('000001.png')
  expect(img.getAttribute('alt')).toBe('')
  expect(img.getAttribute('aria-hidden')).toBe('true')
})

test('is placed by its position', () => {
  const { container } = render(<Harness />)
  const outer = container.firstElementChild as HTMLElement
  expect(outer.style.top).toBe('1%')
  expect(outer.style.left).toBe('2%')
  expect(outer.style.zIndex).toBe('3')
})

test('marks itself while it is turning over', () => {
  const { container, rerender } = render(<Harness flipping={false} />)
  expect(container.querySelector('[data-flipping]')).toBeNull()
  rerender(<Harness flipping />)
  expect(container.querySelector('[data-flipping]')).not.toBeNull()
})

test('a dead image hides itself instead of leaving a broken icon', () => {
  const { container } = render(<Harness />)
  const img = container.querySelector('img') as HTMLImageElement
  img.dispatchEvent(new Event('error'))
  expect(screen.queryByRole('img')).toBeNull()
})
