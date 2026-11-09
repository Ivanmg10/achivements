import { fireEvent, render, screen } from '@testing-library/react'
import AchievementModal from './AchievementModal'
import { en } from '@/translations/en'

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

test('its corner button has a name and closes it', () => {
  const onClose = jest.fn()
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
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

test('opens in the body, out of any section that could cover it', () => {
  const host = document.body.appendChild(document.createElement('div'))
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />, { container: host })
  expect(host).not.toContainElement(screen.getByRole('dialog'))
  expect(screen.getByRole('dialog').closest('.fixed')?.parentElement).toBe(document.body)
})

test('a failed read says so in a sentence, never the status code', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(en.achievement.loadError)
  expect(screen.queryByText(/Error 500/)).not.toBeInTheDocument()
})

test('its stat labels come from T', () => {
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  expect(screen.getByText(en.libraryDetail.pointsShort)).toBeInTheDocument()
  expect(screen.getByText(en.achievement.rarity)).toBeInTheDocument()
})
