jest.mock('@/hooks/useAllGamesGlobal', () => ({ useAllGamesGlobal: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import MainPageConsoleNav from './MainPageConsoleNav'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { CONSOLES } from '@/constants'
import { en } from '@/translations/en'

const FIRST = CONSOLES[0]
const SECOND = CONSOLES[1]

function state(over: Record<string, unknown> = {}) {
  ;(useAllGamesGlobal as jest.Mock).mockReturnValue({
    playing: [], wantToPlay: [], completed: [], loading: false, error: false, refetch: jest.fn(), ...over,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  state()
})

test('a skeleton while the lists load, with no links to wrong places', () => {
  state({ loading: true })
  const { container } = render(<MainPageConsoleNav />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('a failure is reported with a way to try again', () => {
  const refetch = jest.fn()
  state({ error: true, refetch })
  render(<MainPageConsoleNav />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.charts.failedToLoad)
  fireEvent.click(screen.getByRole('button', { name: en.gameInfoPage.retry }))
  expect(refetch).toHaveBeenCalledTimes(1)
})

test('has a link to everything, and one block per list linking to it', () => {
  render(<MainPageConsoleNav />)
  expect(screen.getByRole('link', { name: en.cards.navigation })).toHaveAttribute('href', '/allGames')
  for (const [slug, label] of [['wantToPlay', en.categories.wantToPlay], ['playing', en.categories.playing], ['completed', en.categories.completed]]) {
    expect(screen.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', `/${slug}`)
  }
})

test('every console links to its own page in every list', () => {
  render(<MainPageConsoleNav />)
  expect(screen.getAllByTitle(FIRST.name)).toHaveLength(3)
  expect(screen.getAllByTitle(FIRST.name).map((l) => l.getAttribute('href')).sort()).toEqual(
    [`/completed/${FIRST.id}`, `/playing/${FIRST.id}`, `/wantToPlay/${FIRST.id}`].sort(),
  )
})

test('a console with games in a list is shown on phones too; one without is hidden there', () => {
  state({ playing: [{ ConsoleID: FIRST.id }] })
  render(<MainPageConsoleNav />)
  const withGames = screen.getAllByTitle(FIRST.name).find((l) => l.getAttribute('href') === `/playing/${FIRST.id}`)!
  const without = screen.getAllByTitle(SECOND.name).find((l) => l.getAttribute('href') === `/playing/${SECOND.id}`)!
  expect(withGames.className).not.toMatch(/\bhidden\b/)
  expect(without.className).toMatch(/\bhidden\b/)
})

test('a console is active only in the list its games are in', () => {
  state({ completed: [{ ConsoleID: FIRST.id }] })
  render(<MainPageConsoleNav />)
  const inList = screen.getAllByTitle(FIRST.name).find((l) => l.getAttribute('href') === `/completed/${FIRST.id}`)!
  const elsewhere = screen.getAllByTitle(FIRST.name).find((l) => l.getAttribute('href') === `/playing/${FIRST.id}`)!
  expect(inList.className).not.toMatch(/\bhidden\b/)
  expect(elsewhere.className).toMatch(/\bhidden\b/)
  expect(within(inList).getByRole('img')).not.toHaveClass('opacity-30')
})
