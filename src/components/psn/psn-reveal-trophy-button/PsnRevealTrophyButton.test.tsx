import { render, screen, fireEvent } from '@testing-library/react'
import PsnRevealTrophyButton from './PsnRevealTrophyButton'
import { en } from '@/translations/en'

test('says what it will do, reflects the state, and calls back', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<PsnRevealTrophyButton revealed={false} onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: en.psn.revealTrophy })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledTimes(1)
  rerender(<PsnRevealTrophyButton revealed onToggle={onToggle} />)
  expect(screen.getByRole('button', { name: en.psn.concealTrophy })).toHaveAttribute('aria-pressed', 'true')
})
