import { render, screen } from '@testing-library/react'
import LandingGroup from './LandingGroup'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

const [plain, named] = SAMPLE_GROUPS

test('the name over the band of its games\' covers, how far along it is, its bar and what it holds', () => {
  const { container } = render(<LandingGroup group={plain} />)
  expect(screen.getByRole('heading', { level: 3, name: plain.name })).toBeInTheDocument()
  const pct = Math.round((plain.earned / plain.total) * 100)
  expect(screen.getByText(`${pct}%`)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: plain.name })).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveTextContent(`${plain.games} games, ${plain.earned} of ${plain.total} achievements`)
  expect(Array.from(container.querySelectorAll('img')).map((i) => i.getAttribute('src'))).toEqual(plain.covers)
})

test('a name of the owner\'s own is said in the reader\'s language', () => {
  render(<LandingGroup group={named} />)
  expect(screen.getByRole('heading', { level: 3, name: en.landing.sampleGroupNovember })).toBeInTheDocument()
})
