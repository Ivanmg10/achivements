jest.mock('@/components/games-played-pie-chart/GamesPlayedPieChart', () => ({
  __esModule: true,
  default: () => <div data-testid="pie-chart">PieChart</div>,
}))

jest.mock('@/components/achivements-line-chart/AchievementsLineChart', () => ({
  __esModule: true,
  default: () => <div data-testid="line-chart">LineChart</div>,
}))

jest.mock('@/context/GamesDataContext', () => ({
  useGamesData: () => ({ softcore: [], hardcore: [], achievements: [] }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import UserCharts from './UserCharts'

test('renders charts section', () => {
  render(<UserCharts />)
  expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  expect(screen.getByTestId('line-chart')).toBeInTheDocument()
})

test('toggles to hardcore chart', () => {
  render(<UserCharts />)
  fireEvent.click(screen.getByText('Hardcore'))
  expect(screen.getByText(/Games hardcore/i)).toBeInTheDocument()
})

test('toggles back to softcore', () => {
  render(<UserCharts />)
  fireEvent.click(screen.getByText('Hardcore'))
  fireEvent.click(screen.getByText('Softcore'))
  expect(screen.getByText(/Games softcore/i)).toBeInTheDocument()
})
