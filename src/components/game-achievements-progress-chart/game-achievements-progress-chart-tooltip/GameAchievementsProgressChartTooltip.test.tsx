import { render, screen } from '@testing-library/react'
import GameAchievementsProgressChartTooltip from './GameAchievementsProgressChartTooltip'
import { en } from '@/translations/en'

const title = () => 'Week of 5 Oct'

test('says which period and how many', () => {
  render(<GameAchievementsProgressChartTooltip active title={title} payload={[{ payload: { start: 0, count: 3 } }]} />)
  expect(screen.getByText('Week of 5 Oct')).toBeInTheDocument()
  expect(screen.getByText(`3 ${en.lineChart.achievements}`)).toBeInTheDocument()
})

test('says one in the singular', () => {
  render(<GameAchievementsProgressChartTooltip active title={title} payload={[{ payload: { start: 0, count: 1 } }]} />)
  expect(screen.getByText(en.lineChart.oneAchievement)).toBeInTheDocument()
})

test('draws nothing with no point under the pointer', () => {
  const { container } = render(<GameAchievementsProgressChartTooltip title={title} payload={[{ payload: { start: 0, count: 1 } }]} />)
  expect(container).toBeEmptyDOMElement()
})
