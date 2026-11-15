import { act, render, screen } from '@testing-library/react'
import StreakDayRow from './StreakDayRow'
import { RecentAchievement } from '@/types/types'

jest.mock('next/image', () => {
  const NextImage = ({ src, alt }: { src: string; alt: string }) =>
    <img src={src} alt={alt} />
  NextImage.displayName = 'NextImage'
  return NextImage
})

const RA: RecentAchievement = {
  AchievementID: 7, Date: '2024-03-02 12:00:00', HardcoreMode: '1', Title: 'Beat it',
  Description: '', BadgeName: '12345', Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
}

const STEAM: RecentAchievement = {
  ...RA, AchievementID: 0, Title: 'Win', BadgeName: '', Points: 0, GameID: 620,
  GameTitle: 'Portal 2', ConsoleName: 'Steam', Source: 'steam', BadgeUrl: 'https://cdn/win.jpg',
}

test('the day, its count, "today" and its games, then its achievements listed', () => {
  // A Steam unlock is numbered by its position, so it can collide with an RA id.
  render(<StreakDayRow date="2024-03-02" today="2024-03-02" achievements={[RA, { ...STEAM, AchievementID: 7 }]} />)

  expect(screen.getByRole('heading')).toHaveTextContent(/2 achievements.*today/)
  expect(screen.getByText('Zelda, Portal 2')).toHaveAttribute('title', 'Zelda, Portal 2')
  expect(screen.getAllByRole('link')).toHaveLength(2)
})

test('another day does not say today', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[RA]} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/1 achievement$/)
})

test('a day with nothing lists nothing but keeps its head', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[]} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/0 achievements/)
  expect(screen.queryByRole('link')).toBeNull()
})

test('five achievements at most, then "See more" in its head', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ ...RA, AchievementID: i, Title: `A${i}` }))
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={many} />)
  expect(screen.getAllByRole('link')).toHaveLength(5)
  expect(screen.getByRole('button', { name: 'See more' })).toBeInTheDocument()
})

const award = (data: number) =>
  ({ AwardType: 'Game Beaten', AwardData: data, AwardDataExtra: 1, AwardedAt: '2024-03-02T12:00:00Z', Title: `Game ${data}`, ConsoleName: 'SNES', ImageIcon: '/i.png' }) as never

test('the panel never sets its height: a day with a finished game shows fewer rows in the same box', () => {
  // The list's box: 270 px for five 54 px rows, 204 px once a finished game's card takes its share.
  let notify = () => {}
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    constructor(cb: () => void) {
      notify = cb
    }
    observe() {}
    disconnect() {}
  }
  let box = 270
  const row = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(54)
  const client = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => box)
  const many = Array.from({ length: 8 }, (_, i) => ({ ...RA, AchievementID: i, Title: `A${i}` }))

  const { container, rerender } = render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={many} />)
  const panel = container.firstElementChild as HTMLElement
  const size = panel.className
  expect(size).toMatch(/h-\[24\.25rem\]/)
  expect(screen.getAllByRole('link')).toHaveLength(5)

  rerender(<StreakDayRow date="2024-03-03" today="2024-03-05" achievements={many} awards={[award(1)]} />)
  box = 204
  act(() => notify())
  expect(container.firstElementChild).toBe(panel)
  expect(panel.className).toBe(size)
  // Three achievements and the finished game's card; the rest under "See more".
  expect(screen.getAllByRole('link')).toHaveLength(4)
  expect(screen.getByRole('button', { name: 'See more' })).toBeInTheDocument()

  rerender(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={many} />)
  box = 270
  act(() => notify())
  expect(panel.className).toBe(size)
  expect(screen.getAllByRole('link')).toHaveLength(5)

  row.mockRestore()
  client.mockRestore()
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
})

test('one finished game drawn at most; more of them are under "See more"', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[RA]} awards={[award(1), award(2)]} />)
  expect(screen.getByRole('link', { name: /Game 1/ })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Game 2/ })).toBeNull()
  expect(screen.getByRole('button', { name: 'See more' })).toBeInTheDocument()
})

test('everything fits: no "See more"', () => {
  render(<StreakDayRow date="2024-03-02" today="2024-03-05" achievements={[RA]} />)
  expect(screen.queryByRole('button')).toBeNull()
})
