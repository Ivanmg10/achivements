import { act, fireEvent, render, screen } from '@testing-library/react'
import BrowsePicker from './BrowsePicker'
import { en } from '@/translations/en'
import type { LibraryGame } from '@/utils/library'

jest.mock('@/components/game-cover/GameCover', () => ({
  __esModule: true,
  default: ({ id }: { id: number }) => <div data-testid={`cover-${id}`} />,
}))

const game = (id: number): LibraryGame => ({
  key: `ra:${id}`, source: 'ra', id, title: `Game ${id}`, subtitle: 'SNES', status: 'wantToPlay', pct: 0, href: `/gameInfo/${id}`,
})

const openLink = () => screen.getByRole('link', { name: new RegExp(en.cards.pickOpen) })

afterEach(() => jest.useRealTimers())

test('says so when there is nothing to pick from', () => {
  render(<BrowsePicker pool={[]} />)
  expect(screen.getByText(en.cards.pickEmpty)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('spins, settles on a game, and shows its cover and a link to it', () => {
  jest.useFakeTimers()
  render(<BrowsePicker pool={[game(1), game(2), game(3)]} />)
  fireEvent.click(screen.getByRole('button', { name: en.cards.pickButton }))
  expect(screen.getByRole('button', { name: en.cards.pickButton })).toBeDisabled()
  act(() => jest.runAllTimers())
  const id = openLink().getAttribute('href')!.split('/').pop()
  expect(screen.getByTestId(`cover-${id}`)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.cards.pickAgain })).toBeEnabled()
})

test('another pick never lands on the same game twice in a row', () => {
  jest.useFakeTimers()
  render(<BrowsePicker pool={[game(1), game(2)]} />)
  fireEvent.click(screen.getByRole('button', { name: en.cards.pickButton }))
  act(() => jest.runAllTimers())
  const first = openLink().getAttribute('href')
  fireEvent.click(screen.getByRole('button', { name: en.cards.pickAgain }))
  act(() => jest.runAllTimers())
  expect(openLink().getAttribute('href')).not.toBe(first)
})

test('with a single game it lands at once', () => {
  render(<BrowsePicker pool={[game(7)]} />)
  fireEvent.click(screen.getByRole('button', { name: en.cards.pickButton }))
  expect(screen.getByTestId('cover-7')).toBeInTheDocument()
})
