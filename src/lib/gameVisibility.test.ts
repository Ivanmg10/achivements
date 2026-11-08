jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { notHidden } from './gameVisibility'

test('leaves out the row’s game when its user hid it', () => {
  expect(notHidden('g')).toBe(
    'NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = g.user_id AND h.source = g.source AND h.game_id = g.game_id)',
  )
})

test('another list’s owner when the row has none', () => {
  expect(notHidden('i', '$3')).toBe(
    'NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = $3 AND h.source = i.source AND h.game_id = i.game_id)',
  )
})
