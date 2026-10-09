import { render, screen } from '@testing-library/react'
import MainPageProfilePsnStats from './MainPageProfilePsnStats'
import { en } from '@/translations/en'
import type { PsnSummary } from '@/lib/psnClient'
import type { PsnGameProgress } from '@/types/psn'

const SUMMARY = { games: 23, earned: { bronze: 552, silver: 169, gold: 36, platinum: 8 } } as PsnSummary
const LIBRARY = [
  { playtimeMinutes: 600, playedAs: ['CUSA1'] },
  // A collection: the same played game behind two trophy lists counts once.
  { playtimeMinutes: 120, playedAs: ['CUSA2'] },
  { playtimeMinutes: 120, playedAs: ['CUSA2'] },
  { playtimeMinutes: null, playedAs: [] },
] as PsnGameProgress[]

test('games, play time, platinums and trophies', () => {
  render(<MainPageProfilePsnStats summary={SUMMARY} library={LIBRARY} isLoading={false} />)
  expect(screen.getByText('23')).toBeInTheDocument()
  expect(screen.getByText(`12 ${en.steam.hoursShort}`)).toBeInTheDocument()
  expect(screen.getByText('8')).toBeInTheDocument()
  expect(screen.getByText('765')).toBeInTheDocument()
})

test('the play time waits for the list', () => {
  render(<MainPageProfilePsnStats summary={SUMMARY} library={[]} isLoading />)
  expect(screen.getByText('—')).toBeInTheDocument()
})
