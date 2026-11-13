import { render, screen } from '@testing-library/react'
import LandingRankSlice from './LandingRankSlice'
import { SAMPLE_RANKS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

test('the slice around the player: their place and points named "You", nobody else named', () => {
  render(<LandingRankSlice period="all" />)
  const rows = screen.getAllByRole('listitem')
  const { first, points } = SAMPLE_RANKS.all
  expect(rows).toHaveLength(points.length)
  expect(rows[1]).toHaveTextContent(String(first + 1))
  expect(rows[1]).toHaveTextContent(en.rankings.you)
  expect(rows[1]).toHaveTextContent(points[1].toLocaleString('en'))
  expect(screen.getAllByText(en.landing.otherPlayer)).toHaveLength(points.length - 1)
})

test('another period moves the place and the points', () => {
  render(<LandingRankSlice period="week" />)
  expect(screen.getAllByRole('listitem')[1]).toHaveTextContent(String(SAMPLE_RANKS.week.first + 1))
})
