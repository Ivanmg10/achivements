import { fireEvent, render, screen } from '@testing-library/react'
import LibraryShelfCard from './library-shelf-card/LibraryShelfCard'
import LibraryListRow from './library-list-row/LibraryListRow'
import { libraryEntry } from '@/test-utils/libraryFixtures'
import { en } from '@/translations/en'

jest.mock('@/hooks/useRaScreenshot', () => ({ useRaScreenshot: jest.fn(() => undefined) }))

const ra = libraryEntry('ra', 5, 'Sonic', { pct: 40 })
const steam = libraryEntry('steam', 7, 'Hades')
const psn = libraryEntry('psn', 2018800, 'Astro')

/** Clicking a link in jsdom tries to navigate; the test only needs to know it was a link that was hit. */
const click = (el: Element) => {
  el.addEventListener('click', (e) => e.preventDefault())
  fireEvent.click(el)
}

describe.each([
  // How many links there are besides the title: the icon, and on a shelf the whole picture too.
  ['a shelf card', 2, (onTake: jest.Mock, e = ra) => <LibraryShelfCard entry={e} onPick={onTake} />],
  ['a list row', 1, (onTake: jest.Mock, e = ra) => <LibraryListRow entry={e} current={false} onSelect={onTake} />],
])('%s', (_, pictures, draw) => {
  test('its title is a link to the game of its platform', () => {
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

  test('its pictures are links to the same page, out of the tab order since the title is there', () => {
    const { container } = render(draw(jest.fn(), ra))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1 + pictures)
    const hidden = [...links].filter((a) => a.getAttribute('aria-hidden') === 'true')
    expect(hidden).toHaveLength(pictures)
    hidden.forEach((a) => {
      expect(a).toHaveAttribute('href', '/gameInfo/5')
      expect(a).toHaveAttribute('tabindex', '-1')
    })
  })

  test('the rest of it is a button laid over the whole, with no link inside it', () => {
    const { container } = render(draw(jest.fn()))
    const button = screen.getByRole('button', { name: 'Sonic' })
    expect(button).toHaveClass('absolute', 'inset-0')
    expect(button.querySelector('a')).toBeNull()
    // The links are above the button, so they get the clicks that fall on them.
    container.querySelectorAll('a').forEach((a) => expect(a.className).toMatch(/z-10/))
  })

  test('the button picks the game; the title and the icon do not', () => {
    const onTake = jest.fn()
    const { container } = render(draw(onTake))
    click(screen.getByRole('button', { name: 'Sonic' }))
    expect(onTake).toHaveBeenCalledTimes(1)
    onTake.mockClear()
    click(screen.getByRole('link', { name: 'Sonic' }))
    container.querySelectorAll('a[aria-hidden="true"]').forEach(click)
    expect(onTake).not.toHaveBeenCalled()
  })
})

test('on a shelf the whole picture across the top is a link, not only the icon on it', () => {
  const { container } = render(<LibraryShelfCard entry={ra} onPick={jest.fn()} />)
  const cover = [...container.querySelectorAll('a[aria-hidden="true"]')].find((a) => a.className.includes('inset-0'))!
  expect(cover).toHaveAttribute('href', '/gameInfo/5')
  // It sits over the art, which is what the card's own top is made of.
  expect(cover.parentElement).toContainElement(container.querySelector('[aria-hidden="true"].overflow-hidden'))
})
