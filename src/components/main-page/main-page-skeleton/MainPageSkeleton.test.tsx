import { render, screen } from '@testing-library/react'
import MainPageSkeleton from './MainPageSkeleton'
import { useOptionalMainView } from '@/context/MainViewContext'

jest.mock('@/context/MainViewContext', () => ({ useOptionalMainView: jest.fn() }))

const setView = (view: string | null) => (useOptionalMainView as jest.Mock).mockReturnValue(view ? { view } : null)

beforeEach(() => setView('recent'))

test('announces loading once and hides the shapes', () => {
  const { container } = render(<MainPageSkeleton />)
  expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Loading your achievements')
  expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
  expect(container.querySelectorAll('.home-fit > [aria-hidden="true"]').length).toBeGreaterThan(0)
})

test('does not cover the screen', () => {
  const { container } = render(<MainPageSkeleton />)
  expect(container.querySelector('.fixed')).toBeNull()
})

test('draws both layouts, each in its own box, for the CSS to show one before React runs', () => {
  const { container } = render(<MainPageSkeleton />)
  const classic = container.querySelector('.home-if-classic')!
  const cover = container.querySelector('.home-if-cover')!
  expect(classic.querySelector('.home-cover')).toBeNull()
  expect(classic.querySelector('.home-fit-side [role="status"]')).toBeInTheDocument()
  expect(cover.querySelector('.home-cover')).toBeInTheDocument()
  expect(cover.querySelector('.home-fit-side [role="status"]')).toBeNull()
})

test('the pinned view draws the grid; signed out, with no providers, the plain list', () => {
  setView('pinned')
  const { container, rerender } = render(<MainPageSkeleton />)
  expect(container.querySelector('.home-fit-scroll')).toBeNull()
  setView(null)
  rerender(<MainPageSkeleton />)
  expect(container.querySelector('.home-fit-scroll')).toBeInTheDocument()
})

test('the charts are the real ones loading, so nothing is swapped when they arrive', () => {
  const { container } = render(<MainPageSkeleton />)
  expect(container.querySelector('.home-if-classic [data-testid="heatmap-box"]')).toBeInTheDocument()
  expect(container.querySelector('.home-if-classic .home-fit-chart path')).toBeInTheDocument()
})
