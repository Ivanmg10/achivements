import { render, screen } from '@testing-library/react'
import MainPageProfileXboxStats from './MainPageProfileXboxStats'
import { en } from '@/translations/en'
import type { XboxSummary } from '@/types/xbox'

const SUMMARY: XboxSummary = { gamertag: 'T', avatarUrl: null, bio: '', tier: 'Gold', gamerscore: 10242, achievementsUnlocked: 593, games: 135 }

test('games, gamerscore, achievements and tier', () => {
  render(<MainPageProfileXboxStats summary={SUMMARY} />)
  expect(screen.getByText('135')).toBeInTheDocument()
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByText('593')).toBeInTheDocument()
  expect(screen.getByText('Gold')).toBeInTheDocument()
  expect(screen.getByText(en.xbox.gamerscore)).toBeInTheDocument()
})

test('an account with no tier shows a dash', () => {
  render(<MainPageProfileXboxStats summary={{ ...SUMMARY, tier: '' }} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})
