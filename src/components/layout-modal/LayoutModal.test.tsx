import { render, screen, fireEvent, within } from '@testing-library/react'
import LayoutModal from './LayoutModal'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

function group(name: string) {
  return within(screen.getByRole('group', { name }))
}

test('names itself Layout, with every option in view and no tabs', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: en.homeLayout.layoutLabel })
  expect(dialog.parentElement).toHaveClass('bg-bg-main')
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  for (const name of [en.homeLayout.shapeLabel, en.homeLayout.fontLabel, en.homeLayout.label, en.homeLayout.cardsLabel]) {
    expect(screen.getByRole('group', { name })).toBeInTheDocument()
  }
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
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

test('closed, it draws nothing', () => {
  const { baseElement } = render(<LayoutModal isOpen={false} onClose={jest.fn()} />)
  expect(baseElement.querySelector('[role="dialog"]')).toBeNull()
})
