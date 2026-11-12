import { render, screen } from '@testing-library/react'
import GroupFacts from './GroupFacts'
import type { GameGroup } from '@/types/types'

const group = {
  id: 3, title: 'October', is_public: false, updated_at: new Date(Date.now() - 12 * 86400e3).toISOString(),
  game_count: 4, steam_count: 1, psn_count: 0, xbox_count: 0, total_awarded: 141, total_possible: 176, started_count: 4, completed_count: 0,
} as GameGroup

test('says games, in progress, achievements and when on one line, with the platform logos', () => {
  render(<GroupFacts group={group} />)
  const line = screen.getByText(/4 games/).closest('p')!
  expect(line).toHaveTextContent('4 games, 4 in progress, 141/176 achievements, 12 days ago')
  expect(screen.getByRole('img', { name: /RetroAchievements, Steam/ })).toBeInTheDocument()
})

test('leaves out what a group has none of, with its mark', () => {
  render(<GroupFacts group={{ ...group, started_count: 0, total_awarded: 0, total_possible: 0 }} />)
  const line = screen.getByText(/4 games/).closest('p')!
  expect(line).toHaveTextContent('4 games, 12 days ago')
  expect(line).not.toHaveTextContent(/in progress|achievements/)
})
