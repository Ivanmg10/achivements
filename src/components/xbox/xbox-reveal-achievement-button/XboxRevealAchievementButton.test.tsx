import { render, screen, fireEvent } from '@testing-library/react'
import XboxRevealAchievementButton from './XboxRevealAchievementButton'
import { en } from '@/translations/en'

test('concealed: offers to show, and says it is not pressed', () => {
  const onToggle = jest.fn()
  render(<XboxRevealAchievementButton revealed={false} onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: en.xbox.revealAchievement })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledTimes(1)
})

test('revealed: offers to hide, and says it is pressed', () => {
  render(<XboxRevealAchievementButton revealed onToggle={jest.fn()} />)
  expect(screen.getByRole('button', { name: en.xbox.concealAchievement })).toHaveAttribute('aria-pressed', 'true')
})
