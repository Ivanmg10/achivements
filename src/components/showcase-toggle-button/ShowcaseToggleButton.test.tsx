import { render, screen, fireEvent } from '@testing-library/react'
import ShowcaseToggleButton from './ShowcaseToggleButton'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useSubject } from '@/context/SubjectContext'
import { en } from '@/translations/en'
import type { ShowcaseEntry } from '@/utils/showcase'

jest.mock('@/context/ShowcaseContext', () => ({ useOwnShowcase: jest.fn() }))
jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn() }))

const ENTRY: ShowcaseEntry = { source: 'ra', gameId: 1, achievementKey: '7', gameTitle: 'Zelda', title: 'A', description: null, badge: null, earnedAt: '2026-10-01T00:00:00.000Z' }
const add = jest.fn()
const remove = jest.fn()
const showcase = (items: unknown[]) => (useOwnShowcase as jest.Mock).mockReturnValue({ items, add, remove })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSubject as jest.Mock).mockReturnValue(null)
})

test('adds an earned achievement, or takes it out when it is in', () => {
  showcase([])
  const { unmount } = render(<ShowcaseToggleButton entry={ENTRY} />)
  fireEvent.click(screen.getByRole('button', { name: en.showcase.add }))
  expect(add).toHaveBeenCalledWith(ENTRY)
  unmount()

  showcase([{ ...ENTRY, id: 3 }])
  render(<ShowcaseToggleButton entry={ENTRY} />)
  const button = screen.getByRole('button', { name: en.showcase.remove })
  expect(button).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(button)
  expect(remove).toHaveBeenCalledWith({ ...ENTRY, id: 3 })
})

test('nothing for an unearned achievement, on someone else’s page, or signed out', () => {
  showcase([])
  const { container, rerender } = render(<ShowcaseToggleButton entry={null} />)
  expect(container).toBeEmptyDOMElement()
  ;(useSubject as jest.Mock).mockReturnValue('luna')
  rerender(<ShowcaseToggleButton entry={ENTRY} />)
  expect(container).toBeEmptyDOMElement()
  ;(useSubject as jest.Mock).mockReturnValue(null)
  ;(useOwnShowcase as jest.Mock).mockReturnValue(null)
  rerender(<ShowcaseToggleButton entry={ENTRY} />)
  expect(container).toBeEmptyDOMElement()
})
