import { render, screen, fireEvent, within } from '@testing-library/react'
import LayoutModal from './LayoutModal'
import { en } from '@/translations/en'

const mockChoose = jest.fn()
const mockSaveError = jest.fn(() => false)
jest.mock('@/hooks/useThemeChoice', () => ({ useThemeChoice: () => ({ theme: 'dark', choose: mockChoose, saveError: mockSaveError() }) }))

beforeEach(() => {
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
  for (const name of [en.homeLayout.shapeLabel, en.homeLayout.fontLabel, en.homeLayout.label, en.homeLayout.cardsLabel, en.userTheme.theme]) {
    expect(screen.getByRole('group', { name })).toBeInTheDocument()
  }
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

test('a swatch chooses its theme; the one already on does nothing', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  const themes = group(en.userTheme.theme)

  fireEvent.click(themes.getByRole('button', { name: en.userTheme.name_dark }))
  expect(mockChoose).not.toHaveBeenCalled()
  expect(themes.getByRole('button', { name: en.userTheme.name_dark })).toHaveAttribute('aria-pressed', 'true')

  fireEvent.click(themes.getByRole('button', { name: en.userTheme.name_ocean }))
  expect(mockChoose).toHaveBeenCalledWith('ocean')
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
