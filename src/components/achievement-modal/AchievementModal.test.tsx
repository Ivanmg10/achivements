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

test('its stat labels come from T, and the points unit follows the plural', () => {
  const { rerender } = render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  expect(screen.getByText(en.plurals.pointsLabel.other)).toBeInTheDocument()
  expect(screen.getByText(en.achievement.rarity)).toBeInTheDocument()
  expect(screen.getByText(en.profileStats.truePoints)).toBeInTheDocument()
  rerender(<AchievementModal achievement={{ ...(achievement as object), Points: 1 } as never} numDistinctPlayers={1000} onClose={jest.fn()} />)
  expect(screen.getByText(en.plurals.pointsLabel.one!)).toBeInTheDocument()
  expect(screen.queryByText(en.plurals.pointsLabel.other)).not.toBeInTheDocument()
})

test('the head is the Modal\'s own: its title names it, the description describes it, and it is lg', () => {
  render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: 'First Blood' })
  expect(dialog).toHaveAccessibleDescription('Kill an enemy')
  expect(dialog).toHaveClass('sm:max-w-[47.5rem]')
})

describe('with its detail', () => {
  const comment = (i: number) => ({ User: `user${i}`, Submitted: `2026-10-${String(i).padStart(2, '0')} 10:00:00`, CommentText: `comment ${i}` })
  const detail = {
    unlocks: {
      Achievement: { ID: 7, Title: 'First Blood', Description: 'Kill an enemy', Points: 10, TrueRatio: 1234, Author: 'Madeline', DateCreated: '2020-05-01 10:00:00', DateModified: '' },
      UnlocksCount: 6147,
      TotalPlayers: 6616,
      Unlocks: [{ User: 'ana', RAPoints: 10, DateAwarded: '2026-10-01 10:00:00', HardcoreMode: '1' }],
    },
    comments: { Count: 6, Total: 6, Results: [1, 2, 3, 4, 5, 6].map(comment) },
  }
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(detail) })
  })

  test('the six figures are a row, the three from the detail loading until it arrives', async () => {
    render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
    const row = screen.getByRole('dialog').querySelector('dl') as HTMLElement
    expect(row.querySelectorAll('dt')).toHaveLength(6)
    expect(screen.queryByText('Madeline')).not.toBeInTheDocument()
    expect(await screen.findByText('Madeline')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText(en.achievement.created)).toBeInTheDocument()
  })

  test('the recent unlocks are the library\'s accordion, with their count', async () => {
    render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
    const toggle = await screen.findByRole('button', { name: /6,147 \/ 6,616/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('dialog').textContent).not.toContain('▼')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('the comments are the last four, newest first, and See all shows the rest', async () => {
    render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
    await screen.findByText('comment 6')
    expect(screen.getAllByText(/^comment \d$/).map((e) => e.textContent)).toEqual(['comment 6', 'comment 5', 'comment 4', 'comment 3'])
    fireEvent.click(screen.getByRole('button', { name: en.gameComments.showAll.replace('{n}', '6') }))
    expect(screen.getAllByText(/^comment \d$/)).toHaveLength(6)
    fireEvent.click(screen.getByRole('button', { name: en.gameComments.showLatest.replace('{n}', '4') }))
    expect(screen.getAllByText(/^comment \d$/)).toHaveLength(4)
  })

  test('with four comments or fewer there is no See all', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ...detail, comments: { Count: 2, Total: 2, Results: [comment(1), comment(2)] } }) })
    render(<AchievementModal achievement={achievement} numDistinctPlayers={1000} onClose={jest.fn()} />)
    await screen.findByText('comment 2')
    expect(screen.queryByRole('button', { name: /See all/ })).not.toBeInTheDocument()
  })
})
