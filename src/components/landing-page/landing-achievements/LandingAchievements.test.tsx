import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingAchievements from './LandingAchievements'
import { SAMPLE_ACHIEVEMENTS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

const earned = SAMPLE_ACHIEVEMENTS.filter((a) => a.daysAgo !== null).length

test('says what it adds in points, beside a labelled example of a game page', () => {
  render(<LandingAchievements />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.achievementsTitle })).toBeInTheDocument()
  for (const p of en.landing.achievementsPoints) expect(screen.getByText(p)).toBeInTheDocument()
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Call of Duty: Black Ops II' })).toBeInTheDocument()
  const rows = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
  expect(rows).toHaveLength(SAMPLE_ACHIEVEMENTS.length)
  expect(rows[0]).toHaveTextContent(en.landing.sampleAchievements[0].name)
})

test('its filters work: earned, then to get, then all again', async () => {
  render(<LandingAchievements />)
  await userEvent.click(screen.getByRole('tab', { name: en.userGame.filterEarned }))
  expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(earned)
  await userEvent.click(screen.getByRole('tab', { name: en.userGame.filterLocked }))
  const locked = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
  expect(locked).toHaveLength(SAMPLE_ACHIEVEMENTS.length - earned)
  for (const row of locked) expect(row).toHaveTextContent(en.userGame.notEarned)
  await userEvent.click(screen.getByRole('tab', { name: en.userGame.filterAll }))
  expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(SAMPLE_ACHIEVEMENTS.length)
})

test('the AI button leads to sign-up, as the export needs an account', () => {
  render(<LandingAchievements />)
  expect(screen.getByRole('link', { name: en.aiExport.open })).toHaveAttribute('href', '/authPage?mode=register')
})
