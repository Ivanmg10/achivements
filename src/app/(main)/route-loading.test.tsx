import { render, screen } from '@testing-library/react'
import HomeLoading from './(home)/loading'
import GroupsLoading from './groups/(list)/loading'
import GroupDetailLoading from './groups/[id]/loading'
import GameInfoLoading from './gameInfo/[gameId]/loading'
import SteamLoading from './steamGame/[appId]/loading'
import PsnLoading from './psnGame/[id]/loading'
import UserLoading from './user/(account)/loading'
import PublicUserLoading from './user/[username]/loading'
import AllGamesLoading from './allGames/loading'
import RachaLoading from './racha/loading'
import CategoryLoading from './[category]/(list)/loading'
import CategoryConsoleLoading from './[category]/[consoleId]/loading'

test.each([
  ['the home', HomeLoading],
  ['groups', GroupsLoading],
  ['a group', GroupDetailLoading],
  ['a game', GameInfoLoading],
  ['a Steam game', SteamLoading],
  ['a PSN game', PsnLoading],
  ['the account', UserLoading],
  ['another user', PublicUserLoading],
  ['all games', AllGamesLoading],
  ['the streak', RachaLoading],
  ['a category', CategoryLoading],
  ['a category by console', CategoryConsoleLoading],
])('%s shows its own skeleton, announced as loading', (_name, Loading) => {
  render(<Loading />)

  expect(screen.getAllByRole('status')[0]).toHaveAttribute('aria-busy', 'true')
})
