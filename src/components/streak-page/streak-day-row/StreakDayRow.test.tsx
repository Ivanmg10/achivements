import { render, screen } from '@testing-library/react'
import StreakDayRow from './StreakDayRow'
import { RecentAchievement } from '@/types/types'

jest.mock('next/image', () => {
  const NextImage = ({ src, alt }: { src: string; alt: string }) =>
    <img src={src} alt={alt} />
  NextImage.displayName = 'NextImage'
  return NextImage
})

const RA: RecentAchievement = {
  AchievementID: 7, Date: '2024-03-02 12:00:00', HardcoreMode: '1', Title: 'Beat it',
  Description: '', BadgeName: '12345', Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
}

const STEAM: RecentAchievement = {
  ...RA, AchievementID: 0, Title: 'Win', BadgeName: '', Points: 0, GameID: 620,
  GameTitle: 'Portal 2', ConsoleName: 'Steam', Source: 'steam', BadgeUrl: 'https://cdn/win.jpg',
}

test('the day, its count, "today" and its games, then its achievements listed', () => {
  // A Steam unlock is numbered by its position, so it can collide with an RA id.
  render(<StreakDayRow date="2024-03-02" today="2024-03-02" achievements={[RA, { ...STEAM, AchievementID: 7 }]} />)

  expect(screen.getByRole('heading')).toHaveTextContent(/2 achievements.*today/)
  expect(screen.getByText('Zelda, Portal 2')).toHaveAttribute('title', 'Zelda, Portal 2')
  expect(screen.getAllByRole('link')).toHaveLength(2)
})

test('another day does not say today', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[RA]} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/1 achievement$/)
})

test('a day with nothing lists nothing but keeps its head', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[]} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/0 achievements/)
  expect(screen.queryByRole('link')).toBeNull()
})

test('five achievements at most, then "See more" in its head', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ ...RA, AchievementID: i, Title: `A${i}` }))
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={many} />)
  expect(screen.getAllByRole('link')).toHaveLength(5)
  expect(screen.getByRole('button', { name: 'See more' })).toBeInTheDocument()
})

test('a game finished that day takes a row', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ ...RA, AchievementID: i, Title: `A${i}` }))
  const award = { AwardType: 'Game Beaten', AwardData: 1, AwardDataExtra: 1, AwardedAt: '2024-03-02T12:00:00Z', Title: 'Zelda', ConsoleName: 'SNES', ImageIcon: '/i.png' }
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={many} awards={[award as never]} />)
  // Four achievements plus the finished game's card (a link too).
  expect(screen.getAllByRole('link')).toHaveLength(5)
})

test('everything fits: no "See more"', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[RA]} />)
  expect(screen.queryByRole('button')).toBeNull()
})
