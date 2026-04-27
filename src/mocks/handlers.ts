import { http, HttpResponse } from 'msw'
import userRA from './userRA.json'
import wantToPlay from './wantToPlay.json'
import gamesCompletedSoftcore from './gamesCompletedSoftcore.json'
import gamesCompletedHardcore from './gamesCompletedHardcore.json'
import gameProgressionList from './gameProgression.json'
import recomendedGames from './recomendedGames6.json'
import recentAchievements from './recentAchievements.json'

export const handlers = [
  http.get('/api/getUserProfile', () =>
    HttpResponse.json(userRA),
  ),

  http.get('/api/getRecentAchievements', () =>
    HttpResponse.json(recentAchievements),
  ),

  http.get('/api/getGamesCompleted', () =>
    HttpResponse.json([...gamesCompletedSoftcore, ...gamesCompletedHardcore]),
  ),

  http.get('/api/getGameProgression', ({ request }) => {
    const gameId = new URL(request.url).searchParams.get('gameId')
    const game =
      (gameProgressionList as Array<{ ID: number }>).find(
        g => String(g.ID) === gameId,
      ) ?? gameProgressionList[0]
    return HttpResponse.json(game)
  }),

  http.get('/api/getGameData', () =>
    HttpResponse.json(recomendedGames[0]),
  ),

  http.get('/api/getWantPlayGames', () =>
    HttpResponse.json(wantToPlay),
  ),
]
