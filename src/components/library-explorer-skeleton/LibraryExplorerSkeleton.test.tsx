import { render, screen } from '@testing-library/react'
import LibraryExplorerSkeleton from './LibraryExplorerSkeleton'
import LibraryDetailSkeleton from '@/components/library-detail-skeleton/LibraryDetailSkeleton'
import { en } from '@/translations/en'

describe('the skeleton of the list screen', () => {
  test('announces loading once, and is busy', () => {
    render(<LibraryExplorerSkeleton layout="list" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent(en.loadingPage.title)
  })

  test('draws the rows of the list and the panel of a game beside them', () => {
    const { container } = render(<LibraryExplorerSkeleton layout="list" />)
    // eight rows, each with its icon; one panel with its ring
    expect(container.querySelectorAll('[class*="w-[52px]"]')).toHaveLength(8)
    expect(container.querySelectorAll('[class*="border-[9px]"]')).toHaveLength(1)
  })

  test('the shelves draw titles and cards instead, with no panel', () => {
    const { container } = render(<LibraryExplorerSkeleton layout="shelves" />)
    expect(container.querySelectorAll('.aspect-video')).toHaveLength(8)
    expect(container.querySelector('[class*="border-[9px]"]')).toBeNull()
  })

  test('everything but the announcement is hidden from assistive technology', () => {
    const { container } = render(<LibraryExplorerSkeleton layout="list" />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})

test('the detail skeleton holds the room of the figures and the two panels under the ring', () => {
  const { container } = render(<LibraryDetailSkeleton />)
  expect(container.querySelectorAll('.h-14')).toHaveLength(4)
  expect(container.querySelectorAll('.h-72')).toHaveLength(2)
  expect([...container.children].every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true)
})
