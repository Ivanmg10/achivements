import { render, screen } from '@testing-library/react'
import PsnTrophyCounts from './PsnTrophyCounts'
import { en } from '@/translations/en'

const EARNED = { bronze: 12, silver: 3, gold: 1, platinum: 0 }

test('every grade, best first, each named', () => {
  render(<PsnTrophyCounts earned={EARNED} />)
  // The dot before each is decorative (aria-hidden); the grade's name is what tells them apart.
  const items = screen.getAllByRole('listitem').map((li) => li.textContent?.replace('●', ''))
  expect(items).toEqual([`0${en.psn.platinum}`, `1${en.psn.gold}`, `3${en.psn.silver}`, `12${en.psn.bronze}`])
})

test('against a set, grades the game does not have are left out', () => {
  render(<PsnTrophyCounts earned={EARNED} of={{ bronze: 20, silver: 5, gold: 2, platinum: 0 }} />)
  // The dot before each is decorative (aria-hidden); the grade's name is what tells them apart.
  const items = screen.getAllByRole('listitem').map((li) => li.textContent?.replace('●', ''))
  expect(items).toEqual([`1/2${en.psn.gold}`, `3/5${en.psn.silver}`, `12/20${en.psn.bronze}`])
})
