import { render, screen } from '@testing-library/react'
import MainPageProfileSkeleton from './MainPageProfileSkeleton'

test('announces itself as loading and has every block of a profile', () => {
  const { container } = render(<MainPageProfileSkeleton label="Loading..." />)
  const status = screen.getByRole('status', { name: 'Loading...' })
  expect(status).toHaveAttribute('aria-busy', 'true')
  // Fills the column like the real cards, so it is never a cut-off box.
  expect(status).toHaveClass('h-full')
  // Four stats, the last game, three unlock rows.
  expect(container.querySelectorAll('.grid > div')).toHaveLength(4)
  expect(container.querySelectorAll('.w-10.h-10')).toHaveLength(3)
  expect(container.querySelector('.w-12\\.5')).toBeInTheDocument()
})

test('its unlock rows fill what is left, as many as fit (#202)', () => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  const row = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(52)
  const box = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(320)
  const { container } = render(<MainPageProfileSkeleton label="Loading..." />)
  expect(container.querySelectorAll('.w-10.h-10')).toHaveLength(6)
  row.mockRestore()
  box.mockRestore()
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
})
