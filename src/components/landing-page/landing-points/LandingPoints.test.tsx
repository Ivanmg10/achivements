import { render, screen } from '@testing-library/react'
import LandingPoints from './LandingPoints'
import { SAMPLE_POINTS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'
import { levelOf } from '@/utils/vaultLevel'

const total = Object.values(SAMPLE_POINTS).reduce((s, n) => s + (n ?? 0), 0)

test('what Vault Points are, and the way to how they are counted', () => {
  render(<LandingPoints />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.pointsTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.pointsText)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.rankings.how })).toHaveAttribute('href', '/rankings/how')
})

test('an example: the level from the points, the points, and how they split by platform, in words too', () => {
  render(<LandingPoints />)
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
  expect(screen.getByText(`Lv ${levelOf(total)}`)).toBeInTheDocument()
  expect(document.body).toHaveTextContent(`${total.toLocaleString('en')} VP`)
  expect(screen.getByRole('img', { name: /RA \d+ %, Steam \d+ %, PSN \d+ %/ })).toBeInTheDocument()
  expect(document.body).toHaveTextContent(`Steam ${SAMPLE_POINTS.steam!.toLocaleString('en')}`)
})
