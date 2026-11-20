import { render, screen } from '@testing-library/react'
import LibraryExplorerSkeleton from './LibraryExplorerSkeleton'
import LibraryDetailSkeleton from '@/components/library-detail-skeleton/LibraryDetailSkeleton'
import { en } from '@/translations/en'

describe('the skeleton of the list screen', () => {
  test('announces loading once, and is busy', () => {
    render(<LibraryExplorerSkeleton />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent(en.loadingPage.title)
  })

  test('draws the rows of the list and the panel of a game beside them', () => {
    const { container } = render(<LibraryExplorerSkeleton />)
    // eight rows, each with its icon; one panel with its ring
    expect(container.querySelectorAll('[class*="w-[52px]"]')).toHaveLength(8)
    expect(container.querySelectorAll('.w-32.h-32')).toHaveLength(1)
  })

  test('draws the header the page has: title with platform tabs, count, search and view buttons', () => {
    const { container } = render(<LibraryExplorerSkeleton />)
    expect(container.querySelectorAll('.rounded-full.w-\\[30rem\\]')).toHaveLength(1)
    // The search as wide as the list column, at the toolbar's one height; the order and the two views beside it.
    expect(container.querySelectorAll('[class*="h-(--h-control) w-full"]')).toHaveLength(1)
    expect(container.querySelectorAll('[class*="w-[12.375rem]"]')).toHaveLength(1)
  })

  test('everything but the announcement is hidden from assistive technology', () => {
    const { container } = render(<LibraryExplorerSkeleton />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})

test('the detail skeleton holds the room of the figures and the two panels under the ring', () => {
  const { container } = render(<LibraryDetailSkeleton />)
  expect(container.querySelectorAll('[class*="h-[4.0625rem]"]')).toHaveLength(3)
  expect(container.querySelectorAll('.h-72')).toHaveLength(2)
  expect([...container.children].every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true)
})
