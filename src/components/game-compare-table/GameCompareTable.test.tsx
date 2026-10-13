import { render, screen, fireEvent, within } from '@testing-library/react'
import GameCompareTable from './GameCompareTable'
import type { CompareAchievement } from '@/utils/gameCompare'
import { en } from '@/translations/en'

const ach = (id: string, earned: boolean, earnedAt: string | null = null, over: Partial<CompareAchievement> = {}): CompareAchievement => ({
  id, title: `Title ${id}`, description: `Does ${id}`, iconUrl: null, rarity: null, earned, earnedAt, ...over,
})

const THEIRS = [
  ach('a', true, '2026-01-01 10:00:00', { points: 10, hardcore: true, rarity: 12.34, anchor: 'ach-a' }),
  ach('b', true, '2026-01-05 10:00:00', { grade: 'gold' }),
  ach('c', false),
  ach('d', false),
]
const MINE = [ach('a', true, '2026-01-03 10:00:00'), ach('c', true, null)]
const titles = () => within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.querySelector('p')!.textContent)
const chip = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name} \\d+$`) })

describe('alone', () => {
  test('their progress, with a filter for what they have and have not', () => {
    render(<GameCompareTable theirs={THEIRS} mine={null} username="ivan" comparing={false} />)
    expect(screen.getByText('2/4 · 50%')).toBeInTheDocument()
    expect(screen.queryByText(en.userProfile.you)).not.toBeInTheDocument()
    fireEvent.click(chip(en.userGame.filterEarned))
    expect(titles()).toEqual(['Title a', 'Title b'])
    fireEvent.click(chip(en.userGame.filterLocked))
    expect(titles()).toEqual(['Title c', 'Title d'])
  })

  test('each row says what it asks, its worth, its rarity and when they got it', () => {
    render(<GameCompareTable theirs={THEIRS} mine={null} username="ivan" comparing={false} />)
    const first = screen.getAllByRole('listitem')[0]
    expect(first).toHaveAttribute('id', 'ach-a')
    expect(first).toHaveTextContent('Does a')
    expect(first).toHaveTextContent('10 pts')
    expect(first).toHaveTextContent(en.psn.rarity.replace('{n}', '12.3'))
    expect(first).toHaveTextContent(en.userGame.hardcore)
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent(en.psn.gold)
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent(en.userGame.notEarned)
  })
})

describe('comparing', () => {
  test('both progressions, what you share, and who got each first', () => {
    render(<GameCompareTable theirs={THEIRS} mine={MINE} username="ivan" comparing />)
    expect(screen.getByText(en.userGame.inCommon.replace('{n}', '1'))).toBeInTheDocument()
    const first = screen.getAllByRole('listitem')[0]
    expect(within(first).getByText(en.userGame.first)).toBeInTheDocument()
    // Earned before dates were kept.
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent(en.userGame.earnedNoDate)
  })

  test('filters by who has each one, with counts', () => {
    render(<GameCompareTable theirs={THEIRS} mine={MINE} username="ivan" comparing />)
    fireEvent.click(chip(en.userGame.filterBoth))
    expect(titles()).toEqual(['Title a'])
    fireEvent.click(chip(en.userGame.filterOnly.replace('{who}', 'ivan')))
    expect(titles()).toEqual(['Title b'])
    fireEvent.click(chip(en.userGame.filterOnly.replace('{who}', en.userProfile.you)))
    expect(titles()).toEqual(['Title c'])
    fireEvent.click(chip(en.userGame.filterNeither))
    expect(titles()).toEqual(['Title d'])
  })

  test('a filter left empty says so', () => {
    render(<GameCompareTable theirs={[ach('a', true)]} mine={[]} username="ivan" comparing />)
    fireEvent.click(chip(en.userGame.filterNeither))
    expect(screen.getByText(en.userGame.noneMatch)).toBeInTheDocument()
  })

  test('your side shows as loading, and the note on why it may be empty', () => {
    render(<GameCompareTable theirs={THEIRS} mine={null} username="ivan" comparing mineLoading notice={<p>why</p>} />)
    expect(screen.getByText('why')).toBeInTheDocument()
    expect(screen.queryByText(en.userGame.inCommon.replace('{n}', '0'))).not.toBeInTheDocument()
  })

  test('switching back to their view starts from all', () => {
    const { rerender } = render(<GameCompareTable theirs={THEIRS} mine={MINE} username="ivan" comparing />)
    fireEvent.click(chip(en.userGame.filterBoth))
    rerender(<GameCompareTable theirs={THEIRS} mine={MINE} username="ivan" comparing={false} />)
    expect(titles()).toHaveLength(4)
  })
})

test('a game with no achievements says so', () => {
  render(<GameCompareTable theirs={[]} mine={null} username="ivan" comparing={false} />)
  expect(screen.getByText(en.userGame.noAchievements)).toBeInTheDocument()
})
