import { render, screen, fireEvent, within } from '@testing-library/react'
import DesignCatalog from './DesignCatalog'
import { ALL_PIECES, GROUPS, pieceById } from './catalogue'
import { STREAK_TIERS } from '@/utils/streakTier'

beforeAll(() => {
  global.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn(), takeRecords: jest.fn(), root: null, rootMargin: '', thresholds: [] })) as unknown as typeof IntersectionObserver
})
beforeEach(() => localStorage.clear())

test('every piece in the registry has its card, and the menu lists it under its group', () => {
  render(<DesignCatalog />)
  const menu = screen.getByRole('navigation', { name: 'Design system' })
  for (const group of GROUPS) {
    for (const piece of group.pieces) {
      expect(document.getElementById(piece.id)).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: piece.title })).toBeInTheDocument()
      expect(within(menu).getByRole('link', { name: piece.title })).toHaveAttribute('href', `#${piece.id}`)
    }
  }
  expect(ALL_PIECES.length).toBeGreaterThan(25)
})

test('the registry refuses a piece it does not have', () => {
  expect(() => pieceById('nope')).toThrow('no piece')
})

test('where the shape matters a piece is drawn in both designs, each in its own scope', () => {
  render(<DesignCatalog />)
  const button = document.getElementById('button')!
  expect(button.querySelector('[data-shape="slanted"]')).toBeInTheDocument()
  expect(button.querySelector('[data-shape="round"]')).toBeInTheDocument()
  // The same specimens in each: a primary small button in both.
  expect(within(button).getAllByRole('button', { name: 'primary · sm' })).toHaveLength(2)
})

test('every streak tier is shown', () => {
  render(<DesignCatalog />)
  const tags = document.getElementById('streak-tag')!.querySelectorAll('[data-tier]')
  expect(new Set([...tags].map((t) => t.getAttribute('data-tier')))).toEqual(new Set(STREAK_TIERS.map((t) => t.id)))
})

test('the live pieces answer, each design on its own: a switch flips in one column only', () => {
  render(<DesignCatalog />)
  const switches = within(document.getElementById('switch')!).getAllByRole('switch', { name: 'On by default' })
  expect(switches).toHaveLength(2)
  fireEvent.click(switches[0])
  expect(switches[0]).toHaveAttribute('aria-checked', 'false')
  expect(switches[1]).toHaveAttribute('aria-checked', 'true')
})

test('a modal opens from its card', () => {
  render(<DesignCatalog />)
  fireEvent.click(screen.getByRole('button', { name: 'Open a modal' }))
  expect(screen.getByRole('dialog', { name: 'A modal' })).toBeInTheDocument()
})

test('the header changes the person\'s own shape and card style', () => {
  render(<DesignCatalog />)
  fireEvent.click(screen.getByRole('button', { name: 'Rounded' }))
  expect(localStorage.getItem('shape-style')).toContain('round')
  fireEvent.click(screen.getByRole('button', { name: 'Flat' }))
  expect(localStorage.getItem('game-card-style')).toContain('flat')
})
