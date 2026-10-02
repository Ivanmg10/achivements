import { render, screen } from '@testing-library/react'
import StreakDayRow from './StreakDayRow'
import { RecentAchievement } from '@/types/types'
import { en } from '@/translations/en'

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

test('an RA badge links to its RA page', () => {
  render(<StreakDayRow date="2024-03-02" achievements={[RA]} />)

  const link = screen.getByRole('link', { name: 'Beat it — Zelda' })
  expect(link).toHaveAttribute('href', '/gameInfo/1')
  expect(screen.getByAltText('Beat it')).toHaveAttribute('src', 'https://media.retroachievements.org/Badge/12345.png')
})

test('a Steam badge links to its Steam page and uses the URL it carries', () => {
  render(<StreakDayRow date="2024-03-02" achievements={[STEAM]} />)

  const link = screen.getByRole('link', { name: 'Win — Portal 2' })
  expect(link).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getByAltText('Win')).toHaveAttribute('src', 'https://cdn/win.jpg')
})

test('both platforms on one day render side by side', () => {
  // A Steam unlock is numbered by its position, so it can collide with an RA id.
  render(<StreakDayRow date="2024-03-02" achievements={[RA, { ...STEAM, AchievementID: 7 }]} />)

  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(screen.getByText(`2 ${en.streak.achievements}`)).toBeInTheDocument()
})
