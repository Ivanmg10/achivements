import { render, screen, fireEvent } from '@testing-library/react'
import RevealSecretButton from './RevealSecretButton'

const LABELS = { reveal: 'Show it', conceal: 'Hide it' }

test('concealed: offers to show, says it is not pressed, and calls back', () => {
  const onToggle = jest.fn()
  render(<RevealSecretButton revealed={false} onToggle={onToggle} labels={LABELS} />)
  const button = screen.getByRole('button', { name: 'Show it' })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledTimes(1)
})

test('revealed: offers to hide, and says it is pressed', () => {
  render(<RevealSecretButton revealed onToggle={jest.fn()} labels={LABELS} />)
  expect(screen.getByRole('button', { name: 'Hide it' })).toHaveAttribute('aria-pressed', 'true')
})
