import { render, screen } from '@testing-library/react'
import UserGameRoute from './page'

jest.mock('@/components/user-game-page/UserGamePage', () => ({
  __esModule: true,
  default: ({ username, source, id }: { username: string; source: string; id: string }) => (
    <div data-testid="page" data-user={username} data-source={source} data-id={id} />
  ),
}))

const route = async (username: string, platform: string, id: string) =>
  render(await UserGameRoute({ params: Promise.resolve({ username, platform, id }) }))

test('opens the game of a known platform, with the names decoded', async () => {
  await route('a%20b', 'psn', 'NPWR20188_00')
  const page = screen.getByTestId('page')
  expect(page).toHaveAttribute('data-user', 'a b')
  expect(page).toHaveAttribute('data-source', 'psn')
  expect(page).toHaveAttribute('data-id', 'NPWR20188_00')
})

test('anything else is not found', async () => {
  await expect(route('ivan', 'switch', '1')).rejects.toThrow('NEXT_NOT_FOUND')
  await expect(route('ivan', 'ra', 'abc')).rejects.toThrow('NEXT_NOT_FOUND')
  await expect(route('ivan', 'psn', '123')).rejects.toThrow('NEXT_NOT_FOUND')
})
