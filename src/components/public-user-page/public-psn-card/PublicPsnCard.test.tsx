import { render, screen } from '@testing-library/react'
import PublicPsnCard from './PublicPsnCard'
import { en } from '@/translations/en'
import type { PsnSummary } from '@/lib/psnClient'

const SUMMARY = {
  onlineId: 'BobPS', avatarUrl: null, aboutMe: '', isPlus: false, trophyLevel: 42, tier: 5, levelProgress: 10,
  earned: { bronze: 10, silver: 5, gold: 2, platinum: 1 }, games: 17,
} as PsnSummary

test('shows the online ID, level, headline numbers and a link to Sony', () => {
  render(<PublicPsnCard summary={SUMMARY} />)
  expect(screen.getByText('BobPS')).toBeInTheDocument()
  expect(screen.getByText(`${en.psn.level} 42`)).toBeInTheDocument()
  expect(screen.getByText('17')).toBeInTheDocument()
  expect(screen.getByText('18')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.psn.viewOnPsn })).toHaveAttribute('href', 'https://profile.playstation.com/BobPS')
})
