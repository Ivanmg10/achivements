import { render, screen } from '@testing-library/react'
import GroupPlatformLogos, { platformCounts } from './GroupPlatformLogos'
import type { GameGroup } from '@/types/types'

const group = (over: Partial<GameGroup>) => ({ game_count: 0, steam_count: 0, psn_count: 0, xbox_count: 0, ...over }) as GameGroup

test('RA is what is left once the other platforms are counted', () => {
  expect(platformCounts(group({ game_count: 6, steam_count: 2, psn_count: 1 }))).toEqual({ ra: 3, steam: 2, psn: 1, xbox: 0 })
})

test('named by its platforms, or by the label given', () => {
  const { rerender } = render(<GroupPlatformLogos group={group({ game_count: 3, steam_count: 1 })} />)
  expect(screen.getByRole('img')).toHaveAccessibleName('RetroAchievements, Steam')
  rerender(<GroupPlatformLogos group={group({ game_count: 3, steam_count: 1 })} label="Mixed" />)
  expect(screen.getByRole('img')).toHaveAccessibleName('Mixed')
})

test('nothing for a group with no games', () => {
  const { container } = render(<GroupPlatformLogos group={group({})} />)
  expect(container).toBeEmptyDOMElement()
})
