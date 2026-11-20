import { render, screen } from '@testing-library/react'
import GameInfoSkeleton from './GameInfoSkeleton'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'
import { en } from '@/translations/en'
import { MEDIA_BOX, MEDIA_GRID, MEDIA_ROWS } from '@/components/game-hero/game-hero-media/GameHeroMedia'

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
  // The card holds the tabs' line, then one shape per row.
  expect(container.firstElementChild!.firstElementChild!.children).toHaveLength(4)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test("the pictures' column holds the hero's room: as tall as the row from lg, two pictures stacked in its grid (#167)", () => {
  const { container } = render(<GameInfoSkeleton />)
  const column = container.querySelector('section')!.children[2]
  expect(column).toHaveClass('lg:self-stretch')
  const grid = column.lastElementChild!
  expect(grid.className).toBe(`${MEDIA_GRID} ${MEDIA_ROWS[1]}`)
  for (const box of Array.from(grid.children)) expect(box.className).toContain(`${MEDIA_BOX} lg:col-span-2`)
})

test("the cover holds the platform's shape: a 2:3 portrait unless told otherwise (#203)", () => {
  const cover = (c: HTMLElement) => c.querySelector('section')!.children[0] as HTMLElement
  expect(Number(cover(render(<GameInfoSkeleton />).container).style.aspectRatio)).toBeCloseTo(2 / 3)
  expect(cover(render(<GameInfoSkeleton ratio={0.75} />).container).style.aspectRatio).toBe('0.75')
})
