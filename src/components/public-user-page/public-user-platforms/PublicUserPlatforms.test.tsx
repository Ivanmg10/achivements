import { render, screen } from '@testing-library/react'
import PublicUserPlatforms from './PublicUserPlatforms'
import type { LibraryGame } from '@/utils/library'
import { en } from '@/translations/en'

const game = (key: string, pct: number): LibraryGame => {
  const [source, id] = key.split(':')
  return { key, source: source as LibraryGame['source'], id: Number(id), title: key, subtitle: '', status: pct >= 100 ? 'completed' : 'playing', pct, href: '' }
}

test('one card per platform with games, with its counts and average', () => {
  render(<PublicUserPlatforms games={[game('ra:1', 100), game('ra:2', 50), game('psn:3', 10)]} isLoading={false} />)
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('RetroAchievements')
  expect(items[0]).toHaveTextContent(`${en.userProfile.avgProgress} 75%`)
  expect(items[1]).toHaveTextContent('PlayStation')
})

test('the "at 100%" count is green only when there is one', () => {
  render(<PublicUserPlatforms games={[game('ra:1', 100), game('psn:3', 10)]} isLoading={false} />)
  const completed = screen.getAllByText(en.userProfile.completed).map((dt) => dt.parentElement!.querySelector('dd')!)
  expect(completed[0]).toHaveTextContent('1')
  expect(completed[0].className).toContain('text-success')
  expect(completed[1]).toHaveTextContent('0')
  expect(completed[1].className).not.toContain('text-success')
})

test('no games says so, and loading shows placeholders', () => {
  const { unmount } = render(<PublicUserPlatforms games={[]} isLoading={false} />)
  expect(screen.getByText(en.userProfile.noGames)).toBeInTheDocument()
  unmount()
  render(<PublicUserPlatforms games={[]} isLoading />)
  expect(screen.queryByText(en.userProfile.noGames)).not.toBeInTheDocument()
})
