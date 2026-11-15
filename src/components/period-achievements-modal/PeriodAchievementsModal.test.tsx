import { render, screen, fireEvent } from '@testing-library/react'
import PeriodAchievementsModal from './PeriodAchievementsModal'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

/** The footer's line: Facts split it over several nodes, so match on the whole text. */
const footer = () => [...document.querySelectorAll('p.text-xs')].pop()!

let id = 0
function ach(date: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: ++id, Title: 'Triforce', Description: '', BadgeName: '1',
    Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
  }
}

const dayButton = (name: RegExp) => screen.getByRole('button', { name })

test('the days are on the left, newest first and the newest chosen, with the footer total', () => {
  render(<PeriodAchievementsModal title="This week" achievements={[ach('2020-01-16'), ach('2020-01-17', { Title: 'Sword' })]} onClose={jest.fn()} />)
  expect(screen.getByText('This week')).toBeInTheDocument()
  const days = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.hasAttribute('aria-pressed'))
  expect(days.map((b) => b.textContent)).toEqual([expect.stringContaining('Friday, Jan 17, 2020'), expect.stringContaining('Thursday, Jan 16, 2020')])
  expect(days[0]).toHaveAttribute('aria-pressed', 'true')
  expect(days[1]).toHaveAttribute('aria-pressed', 'false')
  // Only the chosen day's unlocks show.
  expect(screen.getByText('Sword')).toBeInTheDocument()
  expect(screen.queryByText('Triforce')).not.toBeInTheDocument()
  // The footer: the count in its plural and the points, joined by the mark.
  expect(footer()).toHaveTextContent('2 achievements, 50 points')
})

test('choosing another day shows its games, with the game named once above its achievements', () => {
  const day = [
    ach('2020-01-16', { Title: 'One' }),
    ach('2020-01-16', { Title: 'Two' }),
    ach('2020-01-17', { Title: 'Sword', GameID: 2, GameTitle: 'Mario' }),
  ]
  render(<PeriodAchievementsModal title="x" achievements={day} onClose={jest.fn()} />)
  fireEvent.click(dayButton(/Thursday, Jan 16, 2020/))
  expect(dayButton(/Thursday, Jan 16, 2020/)).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getAllByText('Zelda')).toHaveLength(1)
  expect(screen.getByRole('heading', { name: 'Zelda' })).toBeInTheDocument()
  expect(screen.getByText('One')).toBeInTheDocument()
  expect(screen.getByText('Two')).toBeInTheDocument()
  expect(screen.queryByText('Sword')).not.toBeInTheDocument()
})

test('the right pane heads the day with the weekday in the one format, with its count and points', () => {
  render(<PeriodAchievementsModal title="This week" achievements={[ach('2020-01-16')]} onClose={jest.fn()} />)
  const head = screen.getByRole('heading', { name: 'Thursday, Jan 16, 2020' })
  expect(head.className).not.toMatch(/capitalize/)
  expect(head.parentElement).toHaveTextContent('1 achievement, 25 points')
  expect(footer()).toHaveTextContent('1 achievement, 25 points')
})

test('a singular count is "1 achievement", never "1 achievements"', () => {
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-16')]} onClose={jest.fn()} />)
  expect(document.body).not.toHaveTextContent(/1 achievements/)
})

test('shows the hint when given', () => {
  render(<PeriodAchievementsModal title="Best week" hint="Week of Jan 15" achievements={[]} onClose={jest.fn()} />)
  expect(screen.getByText('Week of Jan 15')).toBeInTheDocument()
})

test('lists Steam unlocks as counts only', () => {
  const steam = ach('2020-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam' })
  render(<PeriodAchievementsModal title="This week" achievements={[steam]} onClose={jest.fn()} />)
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
})

test('a list that mixes platforms shows no points anywhere: a total that leaves rows out would mislead', () => {
  const steam = ach('2020-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam' })
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-16'), steam]} onClose={jest.fn()} />)
  expect(footer()).toHaveTextContent(/^2 achievements$/)
  expect(screen.getByRole('heading', { name: 'Thursday, Jan 16, 2020' }).parentElement).toHaveTextContent(/^Thursday, Jan 16, 20202 achievements$/)
})

test('below lg the days are a step and a day has a way back', () => {
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-16')]} onClose={jest.fn()} />)
  const back = screen.getByRole('button', { name: en.dayModal.back })
  const pane = (el: HTMLElement) => el.closest('div[class*="flex-col"][class*="lg:"]')!
  expect(pane(back).className).toContain('hidden lg:flex')
  fireEvent.click(dayButton(/Thursday, Jan 16, 2020/))
  expect(pane(back).className).not.toContain('hidden lg:flex')
  fireEvent.click(back)
  expect(pane(back).className).toContain('hidden lg:flex')
})

test('up and down move focus between the days, Home and End go to the ends', () => {
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-15'), ach('2020-01-16'), ach('2020-01-17')]} onClose={jest.fn()} />)
  const list = screen.getByRole('list', { name: en.dayModal.daysLabel })
  const [first, second, third] = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'))
  first.focus()
  fireEvent.keyDown(list, { key: 'ArrowDown' })
  expect(second).toHaveFocus()
  fireEvent.keyDown(list, { key: 'End' })
  expect(third).toHaveFocus()
  fireEvent.keyDown(list, { key: 'ArrowDown' })
  expect(third).toHaveFocus()
  fireEvent.keyDown(list, { key: 'ArrowUp' })
  expect(second).toHaveFocus()
  fireEvent.keyDown(list, { key: 'Home' })
  expect(first).toHaveFocus()
})

test('says so when empty, and closes', () => {
  const onClose = jest.fn()
  render(<PeriodAchievementsModal title="This month" achievements={[]} empty={en.dayModal.empty} onClose={onClose} />)
  expect(screen.getByText(en.dayModal.empty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

test('opening a day moves the focus to its heading, and back returns it to that day\'s button (#165, H7)', () => {
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-15'), ach('2020-01-16')]} onClose={jest.fn()} />)
  fireEvent.click(dayButton(/Wednesday, Jan 15, 2020/))
  expect(screen.getByRole('heading', { name: 'Wednesday, Jan 15, 2020' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: en.dayModal.back }))
  expect(dayButton(/Wednesday, Jan 15, 2020/)).toHaveFocus()
})
