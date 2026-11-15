import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import ProfileTeaser from './ProfileTeaser'

const teaser = { username: 'Ana', avatar: null, points: 12_345, split: { ra: 10_000, psn: 2_345 }, completed: 7, achievements: 900 }

test('shows what the rankings show, and the way in for the rest', () => {
  render(<ProfileTeaser teaser={teaser} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ana')
  expect(screen.getByText('12,345')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'RA 81 %, PSN 19 %' })).toBeInTheDocument()
  expect(screen.getByText('7')).toBeInTheDocument()
  expect(screen.getByText('900')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.rankings.joinCta })).toHaveAttribute('href', '/authPage?mode=register')
  expect(screen.getByRole('link', { name: en.rankings.seeAll })).toHaveAttribute('href', '/rankings')
})

test('never links to the full profile', () => {
  render(<ProfileTeaser teaser={teaser} />)
  expect(screen.queryByRole('link', { name: 'Ana' })).not.toBeInTheDocument()
})

test('the points in the display italic, the platforms named under their bar, two library buttons (#130)', () => {
  render(<ProfileTeaser teaser={teaser} />)
  expect(screen.getByText('12,345').closest('p')!.className).toContain('font-display italic')
  expect(screen.getByRole('img', { name: 'RA 81 %, PSN 19 %' }).nextElementSibling).toHaveTextContent(/^RAPSN$/)
  const join = screen.getByRole('link', { name: en.rankings.joinCta })
  const all = screen.getByRole('link', { name: en.rankings.seeAll })
  expect(all.className).not.toContain('rounded-full')
  expect(all.className).not.toBe(join.className)
})
