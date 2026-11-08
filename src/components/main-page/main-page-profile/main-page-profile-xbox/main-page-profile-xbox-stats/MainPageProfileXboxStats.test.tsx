import { render, screen } from '@testing-library/react'
import MainPageProfileXboxStats from './MainPageProfileXboxStats'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'
import type { XboxSummary } from '@/types/xbox'

const SUMMARY: XboxSummary = { gamertag: 'T', avatarUrl: null, bio: '', tier: 'Gold', gamerscore: 10242, achievementsUnlocked: 593, games: 135 }
const PLAYED = formatPlaytime(3409 + 60, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en')

test('games, play time, gamerscore and achievements', () => {
  const library = [xboxGameFixture({ playtimeMinutes: 3409 }), xboxGameFixture({ id: 2, playtimeMinutes: 60 }), xboxGameFixture({ id: 3, playtimeMinutes: null })]
  render(<MainPageProfileXboxStats summary={SUMMARY} library={library} isLoading={false} />)
  expect(screen.getByText('135')).toBeInTheDocument()
  expect(screen.getByText(PLAYED)).toBeInTheDocument()
  expect(screen.getByText(en.steam.totalPlaytime)).toBeInTheDocument()
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByText('593')).toBeInTheDocument()
  expect(screen.getByText(en.xbox.gamerscore)).toBeInTheDocument()
})

test('the play time is a skeleton while loading, a dash only when Xbox gave none (B-05)', () => {
  const { container, rerender } = render(<MainPageProfileXboxStats summary={SUMMARY} library={[xboxGameFixture({ playtimeMinutes: 3409 })]} isLoading />)
  expect(screen.queryByText('—')).not.toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).not.toBeNull()
  rerender(<MainPageProfileXboxStats summary={SUMMARY} library={[xboxGameFixture({ playtimeMinutes: null })]} isLoading={false} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})
