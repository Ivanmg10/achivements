import { render, screen } from '@testing-library/react'
import LandingGroups from './LandingGroups'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

test('the title with what it does in points, and the example groups going by, each once for a screen reader', () => {
  render(<LandingGroups />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.organiseTitle })).toBeInTheDocument()
  for (const point of en.landing.organisePoints) expect(screen.getByText(point)).toBeInTheDocument()
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(SAMPLE_GROUPS.map((g) => (g.named ? en.landing[g.named] : g.name)))
})
