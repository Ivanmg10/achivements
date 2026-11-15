import { fireEvent, render, screen } from '@testing-library/react'
import PeriodAchievementsDay from './PeriodAchievementsDay'
import { groupDays } from '@/utils/periodDays'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

let id = 0
const ach = (over: Partial<RecentAchievement> = {}): RecentAchievement => ({
  Date: '2020-01-16 12:00:00', HardcoreMode: '1', AchievementID: ++id, Title: `T${id}`, Description: '', BadgeName: '1',
  Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
})

test('heads the day, then each game once with its achievements', () => {
  const [day] = groupDays([ach(), ach(), ach({ GameID: 2, GameTitle: 'Mario' })])
  render(<PeriodAchievementsDay day={day} onNavigate={jest.fn()} />)
  expect(screen.getByRole('heading', { name: 'Thursday, Jan 16, 2020' }).parentElement).toHaveTextContent('3 achievements, 30 points')
  expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2)
  expect(screen.getAllByRole('link')).toHaveLength(3)
})

test('hideHead leaves the head to the dialog, and what is above goes over the games', () => {
  const [day] = groupDays([ach()])
  render(<PeriodAchievementsDay day={day} onNavigate={jest.fn()} hideHead above={<p>awards</p>} />)
  expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  expect(screen.getByText('awards').compareDocumentPosition(screen.getByRole('heading', { level: 4 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('the way back is there only when asked for, and goes back', () => {
  const [day] = groupDays([ach()])
  const onBack = jest.fn()
  const { rerender } = render(<PeriodAchievementsDay day={day} onNavigate={jest.fn()} />)
  expect(screen.queryByRole('button', { name: en.dayModal.back })).not.toBeInTheDocument()
  rerender(<PeriodAchievementsDay day={day} onNavigate={jest.fn()} onBack={onBack} />)
  fireEvent.click(screen.getByRole('button', { name: en.dayModal.back }))
  expect(onBack).toHaveBeenCalled()
})

test('opening an achievement reports the navigation', () => {
  const [day] = groupDays([ach()])
  const onNavigate = jest.fn()
  render(<PeriodAchievementsDay day={day} onNavigate={onNavigate} />)
  fireEvent.click(screen.getByRole('link'))
  expect(onNavigate).toHaveBeenCalled()
})
