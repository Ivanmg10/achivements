import { render, screen, fireEvent, within } from '@testing-library/react'
import LayoutModal from './LayoutModal'
import { en } from '@/translations/en'
import { THEMES } from '@/types/types'

const mockChoose = jest.fn()
const mockSaveError = jest.fn(() => false)
jest.mock('@/hooks/useThemeChoice', () => ({ useThemeChoice: () => ({ theme: 'dark', choose: mockChoose, saveError: mockSaveError() }) }))

beforeEach(() => {
  Element.prototype.scrollTo = jest.fn()
  Element.prototype.scrollBy = jest.fn()
  localStorage.clear()
  mockChoose.mockClear()
  mockSaveError.mockReturnValue(false)
})

function group(name: string) {
  return within(screen.getByRole('group', { name }))
}

test('names itself Layout, with every option in view and no tabs', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: en.homeLayout.layoutLabel })
  expect(dialog.parentElement).toHaveClass('bg-black/80')
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  for (const name of [en.homeLayout.shapeLabel, en.homeLayout.fontLabel, en.homeLayout.label, en.homeLayout.cardsLabel]) {
    expect(screen.getByRole('group', { name })).toBeInTheDocument()
  }
  expect(screen.getByRole('radiogroup', { name: en.userTheme.theme })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: en.homeLayout.previewLabel })).toBeInTheDocument()
})

test('choices apply to the sample home at once', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  const preview = screen.getByRole('region', { name: en.homeLayout.previewLabel })

  fireEvent.click(group(en.homeLayout.shapeLabel).getByRole('button', { name: en.homeLayout.shapeRound }))
  fireEvent.click(group(en.homeLayout.fontLabel).getByRole('button', { name: 'Sofia' }))
  fireEvent.click(group(en.homeLayout.label).getByRole('button', { name: en.homeLayout.cover }))
  fireEvent.click(group(en.homeLayout.cardsLabel).getByRole('button', { name: en.homeLayout.cardsFlat }))

  expect(preview).toHaveAttribute('data-shape', 'round')
  expect(preview).toHaveAttribute('data-font', 'sofia')
  expect(preview).toHaveAttribute('data-layout', 'cover')
  expect(preview).toHaveAttribute('data-cards', 'flat')
})

test('a font is tried in the sample and reaches the page on the way out', () => {
  const onClose = jest.fn()
  render(<LayoutModal isOpen onClose={onClose} />)
  const preview = screen.getByRole('region', { name: en.homeLayout.previewLabel })

  fireEvent.click(group(en.homeLayout.fontLabel).getByRole('button', { name: 'Fira' }))
  expect(preview).toHaveAttribute('data-font', 'fira')
  expect(group(en.homeLayout.fontLabel).getByRole('button', { name: 'Fira' })).toHaveAttribute('aria-pressed', 'true')
  expect(localStorage.getItem('font-style')).toBeNull()

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(localStorage.getItem('font-style')).toBe('fira')
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('every theme is there, and one is chosen with a click; the one already on does nothing', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  expect(screen.getAllByRole('radio')).toHaveLength(THEMES.length)

  fireEvent.click(screen.getByRole('radio', { name: en.userTheme.name_dark }))
  expect(mockChoose).not.toHaveBeenCalled()
  expect(screen.getByRole('radio', { name: en.userTheme.name_dark })).toHaveAttribute('aria-checked', 'true')

  fireEvent.click(screen.getByRole('radio', { name: en.userTheme.name_ocean }))
  expect(mockChoose).toHaveBeenCalledWith('ocean')
})

test('the pills say where the strip is and jump to a family; the arrows move it', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  const games = screen.getByRole('button', { name: new RegExp(en.userTheme.group_games) })
  expect(screen.getByRole('button', { name: new RegExp(en.userTheme.group_base) })).toHaveAttribute('aria-pressed', 'true')

  ;(Element.prototype.scrollTo as jest.Mock).mockClear()
  fireEvent.click(games)
  expect(Element.prototype.scrollTo).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getByRole('button', { name: en.homeLayout.themesOn }))
  expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1)
})

test('a failed theme save says so in place, since the dialog stays open', () => {
  mockSaveError.mockReturnValue(true)
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userTheme.saveError)
})

test('closed, it draws nothing', () => {
  const { baseElement } = render(<LayoutModal isOpen={false} onClose={jest.fn()} />)
  expect(baseElement.querySelector('[role="dialog"]')).toBeNull()
})
