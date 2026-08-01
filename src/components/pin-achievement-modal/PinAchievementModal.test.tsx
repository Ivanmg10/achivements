import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PinAchievementModal } from './PinAchievementModal'
import { RetroAchievement } from '@/types/types'

global.fetch = jest.fn()

const unearned: RetroAchievement = {
  ID: 1,
  NumAwarded: 10,
  NumAwardedHardcore: 5,
  Title: 'Locked achievement',
  Description: 'Do the thing',
  Points: 10,
  TrueRatio: 10,
  Author: 'someone',
  AuthorULID: 'a',
  DateModified: '2024-01-01',
  DateCreated: '2024-01-01',
  BadgeName: 'badge1',
  DisplayOrder: 0,
  MemAddr: '0x00',
  Type: null,
  DateEarned: null,
  DateEarnedHardcore: null,
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('renders nothing when closed', () => {
  render(
    <PinAchievementModal
      isOpen={false}
      onClose={jest.fn()}
      achievements={[unearned]}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      onPinned={jest.fn()}
    />,
  )
  expect(screen.queryByText('Pin an achievement')).not.toBeInTheDocument()
})

test('shows the empty state when there are no unearned achievements', () => {
  render(
    <PinAchievementModal
      isOpen
      onClose={jest.fn()}
      achievements={[]}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      onPinned={jest.fn()}
    />,
  )
  expect(screen.getByText('No achievements left to pin')).toBeInTheDocument()
})

test('pins an achievement and closes the modal', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  const onPinned = jest.fn()
  const onClose = jest.fn()
  render(
    <PinAchievementModal
      isOpen
      onClose={onClose}
      achievements={[unearned]}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      onPinned={onPinned}
    />,
  )
  fireEvent.click(screen.getByText('Locked achievement'))
  await waitFor(() => expect(onPinned).toHaveBeenCalled())
  expect(onClose).toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledWith(
    '/api/favorites',
    expect.objectContaining({ method: 'POST' }),
  )
})

test('shows an error and keeps the modal open when pinning fails', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false })
  const onClose = jest.fn()
  render(
    <PinAchievementModal
      isOpen
      onClose={onClose}
      achievements={[unearned]}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      onPinned={jest.fn()}
    />,
  )
  fireEvent.click(screen.getByText('Locked achievement'))
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  expect(onClose).not.toHaveBeenCalled()
})

test('closes on escape key', () => {
  const onClose = jest.fn()
  render(
    <PinAchievementModal
      isOpen
      onClose={onClose}
      achievements={[unearned]}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      onPinned={jest.fn()}
    />,
  )
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})
