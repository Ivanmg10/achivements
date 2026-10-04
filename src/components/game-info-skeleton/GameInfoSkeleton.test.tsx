import { render, screen } from '@testing-library/react'
import GameInfoSkeleton from './GameInfoSkeleton'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'
import { en } from '@/translations/en'

test('announces loading once and hides the shapes', () => {
  const { container } = render(<GameInfoSkeleton />)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status')).toHaveTextContent(en.loadingPage.game)
  expect(container.querySelector('[role="status"] > [aria-hidden="true"]')).toBeInTheDocument()
})

test('does not cover the screen: it sits where the page will be', () => {
  const { container } = render(<GameInfoSkeleton />)
  expect(container.querySelector('.fixed')).toBeNull()
})

test('the table skeleton draws the rows it is asked for', () => {
  const { container } = render(<GameInfoSkeletonTable rows={3} />)
  expect(container.firstElementChild!.children).toHaveLength(3)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})
