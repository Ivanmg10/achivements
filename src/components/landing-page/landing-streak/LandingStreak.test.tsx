import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingStreak from './LandingStreak'
import { SAMPLE_STREAKS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

const live = SAMPLE_STREAKS[0]

test('the streak going on in big, with its dates, beside the best streaks as /racha draws them', () => {
  render(<LandingStreak />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.progressTitle })).toBeInTheDocument()
  expect(screen.getByText(`${live.days} days`)).toBeInTheDocument()
  expect(screen.getByText(/^From .+ to .+, without missing a day\.$/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.streak.chartTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
})

test('grey but the one shown: the live one at first, another when picked, none when picked again', async () => {
  render(<LandingStreak />)
  const pressed = () => screen.queryAllByRole('button', { pressed: true })
  expect(pressed()).toHaveLength(1)
  expect(pressed()[0]).toHaveAccessibleName(new RegExp(en.streak.ongoing))
  const second = screen.getAllByRole('button', { pressed: false })[0]
  await userEvent.click(second)
  expect(second).toHaveAttribute('aria-pressed', 'true')
  expect(pressed()).toHaveLength(1)
  await userEvent.click(second)
  expect(pressed()).toHaveLength(0)
})
