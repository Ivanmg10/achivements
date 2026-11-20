import { gameInfoRows } from './gameInfoRows'

const L = { console: 'Console', developer: 'Developer', publisher: 'Publisher', genre: 'Genre', released: 'Released' }

test('every fact known, in order, lists joined', () => {
  expect(gameInfoRows(L, { console: 'Xbox 360', developers: ['TT Games'], publishers: ['LucasArts', 'Disney'], genres: ['Action'], released: '22 Mar 2011' })).toEqual([
    { label: 'Console', value: 'Xbox 360' },
    { label: 'Developer', value: 'TT Games' },
    { label: 'Publisher', value: 'LucasArts, Disney' },
    { label: 'Genre', value: 'Action' },
    { label: 'Released', value: '22 Mar 2011' },
  ])
})

test('what is not known is left out', () => {
  expect(gameInfoRows(L, { console: 'PS4', developers: [], released: null })).toEqual([{ label: 'Console', value: 'PS4' }])
  expect(gameInfoRows(L, {})).toEqual([])
})
