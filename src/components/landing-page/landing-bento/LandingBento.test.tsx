import { render, screen } from '@testing-library/react'
import LandingBento from './LandingBento'
import { en } from '@/translations/en'

test('one tile per thing you get', () => {
  render(<LandingBento />)
  expect(screen.getAllByRole('article')).toHaveLength(3)
  for (const title of [en.landing.libraryTitle, en.landing.organiseTitle, en.landing.progressTitle]) {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  }
})

test('the covers are decoration; the platforms are named in text', () => {
  const { container } = render(<LandingBento />)
  for (const img of container.querySelectorAll('img[alt=""]')) {
    expect(img.closest('[aria-hidden="true"]') ?? img).toBeTruthy()
  }
  expect(screen.getByText('RetroAchievements')).toBeInTheDocument()
  expect(screen.getByText(en.landing.psnSoon)).toBeInTheDocument()
})
