jest.mock('@/hooks/useRaScreenshot', () => ({ useRaScreenshot: jest.fn(() => undefined) }))

import { fireEvent, render, screen } from '@testing-library/react'
import LibraryShelfCard from './library-shelf-card/LibraryShelfCard'
import LibraryListRow from './library-list-row/LibraryListRow'
import { libraryEntry } from '@/test-utils/libraryFixtures'
import { en } from '@/translations/en'

const ra = libraryEntry('ra', 5, 'Sonic', { pct: 40 })
const steam = libraryEntry('steam', 7, 'Hades')
const psn = libraryEntry('psn', 2018800, 'Astro')

/** Clicking a link in jsdom tries to navigate; the test only needs to know it was a link that was hit. */
const click = (el: Element) => {
  el.addEventListener('click', (e) => e.preventDefault())
  fireEvent.click(el)
}

/*
 * A game in a shelf and a game in the list work the same way: the icon and the
 * name open the game's own page, and the rest opens the game beside the list
 * (from the shelves, the list itself). That rest is a button laid over the
 * whole, with the two links above it.
 */
describe.each([
  ['a card on a shelf', (onTake: jest.Mock, e = ra) => <LibraryShelfCard entry={e} onPick={onTake} />],
  ['a row in the list', (onTake: jest.Mock, e = ra) => <LibraryListRow entry={e} current={false} onSelect={onTake} />],
])('%s: only the icon and the name open the game', (_, draw) => {
  test('the name is a link to the game of its platform', () => {
    render(draw(jest.fn(), ra))
    expect(screen.getByRole('link', { name: 'Sonic' })).toHaveAttribute('href', '/gameInfo/5')
    expect(screen.getByRole('link', { name: 'Sonic' })).toHaveAttribute('title', en.libraryLayout.openGame)
  })

  test('Steam and PlayStation games go to their own pages', () => {
    const { unmount } = render(draw(jest.fn(), steam))
    expect(screen.getByRole('link', { name: 'Hades' })).toHaveAttribute('href', '/steamGame/7')
    unmount()
    render(draw(jest.fn(), psn))
    expect(screen.getByRole('link', { name: 'Astro' }).getAttribute('href')).toMatch(/^\/psnGame\//)
  })

  test('the icon is the only other link, to the same page, out of the tab order since the name is there', () => {
    const { container } = render(draw(jest.fn(), ra))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(2)
    const icon = [...links].find((a) => a.getAttribute('aria-hidden') === 'true')!
    expect(icon).toHaveAttribute('href', '/gameInfo/5')
    expect(icon).toHaveAttribute('tabindex', '-1')
  })

  test('the link of the name is not stretched: it is as wide as the name', () => {
    render(draw(jest.fn(), ra))
    expect(screen.getByRole('link', { name: 'Sonic' }).className).not.toMatch(/after:/)
  })

  test('the rest is one button laid over the whole, with no link inside it, under the links', () => {
    const { container } = render(draw(jest.fn()))
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveClass('absolute', 'inset-0')
    expect(buttons[0].querySelector('a')).toBeNull()
    container.querySelectorAll('a').forEach((a) => expect(a.className).toMatch(/z-10/))
  })

  test('the button picks the game; the name and the icon do not', () => {
    const onTake = jest.fn()
    const { container } = render(draw(onTake))
    click(container.querySelector('button')!)
    expect(onTake).toHaveBeenCalledTimes(1)
    expect(onTake).toHaveBeenCalledWith(ra)
    onTake.mockClear()
    click(screen.getByRole('link', { name: 'Sonic' }))
    container.querySelectorAll('a[aria-hidden="true"]').forEach(click)
    expect(onTake).not.toHaveBeenCalled()
  })
})

test('the button of a card on a shelf says what it does, by name', () => {
  render(<LibraryShelfCard entry={ra} onPick={jest.fn()} />)
  expect(screen.getByRole('button', { name: `${en.libraryLayout.openInList}: Sonic` })).toBeInTheDocument()
})

test('the button of a row says the game, which the list already shows', () => {
  render(<LibraryListRow entry={ra} current={false} onSelect={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Sonic' })).toBeInTheDocument()
})
