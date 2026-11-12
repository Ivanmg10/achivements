import { render, screen } from '@testing-library/react'
import StreakDayAchievements from './StreakDayAchievements'
import { RecentAchievement } from '@/types/types'

jest.mock('next/image', () => {
  const NextImage = ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
  NextImage.displayName = 'NextImage'
  return NextImage
})

const RA: RecentAchievement = {
  AchievementID: 7, Date: '2024-03-02 12:00:00', HardcoreMode: '1', Title: 'Beat it',
  Description: '', BadgeName: '12345', Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
}
const STEAM: RecentAchievement = {
  ...RA, AchievementID: 7, HardcoreMode: '0', Title: 'Win', BadgeName: '', Points: 0, GameID: 620,
  GameTitle: 'Portal 2', ConsoleName: 'Steam', Source: 'steam', BadgeUrl: 'https://cdn/win.jpg',
}

test('each achievement names itself and its game and opens the game on its platform', () => {
  render(<StreakDayAchievements achievements={[RA, STEAM]} />)
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(2)
  expect(links[0]).toHaveAttribute('href', '/gameInfo/1')
  expect(links[0]).toHaveTextContent('Beat itZelda')
  expect(links[0].querySelector('img')).toHaveAttribute('src', 'https://media.retroachievements.org/Badge/12345.png')
  expect(links[1]).toHaveAttribute('href', '/steamGame/620')
  expect(links[1].querySelector('img')).toHaveAttribute('src', 'https://cdn/win.jpg')
})
