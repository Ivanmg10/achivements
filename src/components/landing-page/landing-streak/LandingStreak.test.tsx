import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingStreak from './LandingStreak'
import { SAMPLE_STREAKS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

const live = SAMPLE_STREAKS[0]
const calendarDays = () => screen.getAllByRole('button').filter((b) => b.hasAttribute('data-day'))

test('says what a streak is, then the one going on with its label and its dates, no extras', () => {
  render(<LandingStreak />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.progressTitle })).toBeInTheDocument()
  expect(screen.getByText(en.streak.yourStreak)).toBeInTheDocument()
  expect(screen.getByText(`${live.days} days`)).toBeInTheDocument()
  expect(screen.getByText(/^From .+ to today, without missing a day\.$/)).toBeInTheDocument()
  expect(screen.queryByText(en.streak.newRecord)).not.toBeInTheDocument()
})

test('its days in the streak calendar: today picked at first, another day picked shows its count', async () => {
  render(<LandingStreak />)
  const days = calendarDays()
  expect(days.filter((d) => d.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
  await userEvent.click(days[0])
  expect(calendarDays()[0]).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText((_, el) => el?.tagName === 'P' && /^\w+, \w+ \d+: \d achievements?$/.test(el.textContent ?? ''))).toBeInTheDocument()
})
