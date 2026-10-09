import { render, screen } from '@testing-library/react'
import AchivementsLineChartTooltip from './AchivementsLineChartTooltip'
import { en } from '@/translations/en'

const day = (ra: number, steam: number, psn = 0) => ({ payload: { date: '2026-09-29', ra, steam, psn, total: ra + steam + psn } })

test('nothing while the pointer is not on a day', () => {
  const { container } = render(<AchivementsLineChartTooltip active={false} payload={[day(1, 0)]} />)
  expect(container).toBeEmptyDOMElement()
})

test('the date, then each platform with a count that day', () => {
  render(<AchivementsLineChartTooltip active payload={[day(3, 2)]} />)
  expect(screen.getByText('RetroAchievements')).toBeInTheDocument()
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})

test('a platform with nothing is left out; an empty day says so', () => {
  const { rerender } = render(<AchivementsLineChartTooltip active payload={[day(4, 0)]} />)
  expect(screen.queryByText('Steam')).not.toBeInTheDocument()
  rerender(<AchivementsLineChartTooltip active payload={[day(0, 0)]} />)
  expect(screen.getByText(`0 ${en.lineChart.achievements}`)).toBeInTheDocument()
})

test('PSN gets its own line when it has trophies that day', () => {
  render(<AchivementsLineChartTooltip active payload={[day(0, 0, 5)]} />)
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
})
