import { render, screen } from '@testing-library/react'
import PublicUserAchievementShowcase from './PublicUserAchievementShowcase'
import { useShowcase } from '@/hooks/useShowcase'
import { useSubject } from '@/context/SubjectContext'
import { en } from '@/translations/en'

jest.mock('@/hooks/useShowcase', () => ({ useShowcase: jest.fn() }))
jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn(() => 'luna') }))

const ITEM = { id: 1, source: 'ra', gameId: 3, achievementKey: '42', gameTitle: 'Super Metroid', title: 'Sin daños', description: null, badge: null, earnedAt: '2026-10-01T00:00:00.000Z' }
const setup = (over: Record<string, unknown>) =>
  (useShowcase as jest.Mock).mockReturnValue({ items: [], isLoading: false, error: false, retry: jest.fn(), ...over })

test('their showcase, each opening their progress in its game, with nothing to change', () => {
  setup({ items: [ITEM] })
  render(<PublicUserAchievementShowcase />)
  expect(useSubject).toHaveBeenCalled()
  expect(screen.getByText('Sin daños')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Super Metroid/ })).toHaveAttribute('href', '/user/luna/ra/3')
  expect(screen.queryByRole('button', { name: new RegExp(en.showcase.remove) })).not.toBeInTheDocument()
})

test('empty, says so', () => {
  setup({})
  render(<PublicUserAchievementShowcase />)
  expect(screen.getByText(en.showcase.emptyPublic)).toBeInTheDocument()
})
