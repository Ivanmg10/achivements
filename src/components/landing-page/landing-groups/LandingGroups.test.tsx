import { render, screen } from '@testing-library/react'
import LandingGroups from './LandingGroups'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

test('the title with its line, and the example groups in a row', () => {
  render(<LandingGroups />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.organiseTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.organiseText)).toBeInTheDocument()
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(SAMPLE_GROUPS.map((g) => g.name))
})
