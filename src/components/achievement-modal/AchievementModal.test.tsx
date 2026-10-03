import { fireEvent, render, screen } from '@testing-library/react'
import AchievementModal from './AchievementModal'

const achievement = {
  ID: 7,
  Title: 'First Blood',
  Description: 'Kill an enemy',
  BadgeName: 'badge123',
  Points: 10,
  TrueRatio: 15,
  NumAwarded: 500,
  NumAwardedHardcore: 100,
  DateEarned: null,
  DateEarnedHardcore: null,
  Author: 'Author1',
  DisplayOrder: 1,
  Type: null,
} as never

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
})

test('is a modal dialog named by the achievement, with the focus inside', () => {
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: 'First Blood' })
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(dialog).toHaveFocus()
})

test('Escape closes it', () => {
  const onClose = jest.fn()
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={onClose} />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('closing gives the focus back to what opened it', () => {
  const opener = document.createElement('button')
  document.body.appendChild(opener)
  opener.focus()
  const { unmount } = render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  unmount()
  expect(opener).toHaveFocus()
  opener.remove()
})
