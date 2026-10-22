import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import WelcomePageCurtain from './WelcomePageCurtain'

const T = en.welcome

test('shows the step left and the one reached, and the new word, to no one', () => {
  const { container } = render(<WelcomePageCurtain transition={{ from: 1, to: 2, direction: 'forward' }} />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText(T.steps.ra)).toBeInTheDocument()
  expect(screen.getByText(T.steps.steam)).toBeInTheDocument()
  expect(screen.getAllByText(new RegExp(T.words.steam)).length).toBeGreaterThan(0)
})

test('going back, the step reached sits on the left', () => {
  render(<WelcomePageCurtain transition={{ from: 5, to: 4, direction: 'back' }} />)
  const reached = screen.getByText(T.steps.profile).parentElement as HTMLElement
  const left = screen.getByText(T.steps.prefs).parentElement as HTMLElement
  expect(reached.style.left).toBe('32%')
  expect(left.style.left).toBe('66%')
})
