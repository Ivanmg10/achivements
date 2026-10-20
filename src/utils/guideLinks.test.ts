import { guideLinks } from './guideLinks'

test('a Steam achievement: YouTube, then the game\'s Steam guides searched for it', () => {
  const links = guideLinks('steam', { gameTitle: 'Portal 2', title: 'Still Alive', appId: 620 })
  expect(links.map((l) => l.kind)).toEqual(['youtube', 'steamGuides'])
  expect(links[0].href).toBe('https://www.youtube.com/results?search_query=Portal%202%20Still%20Alive%20achievement%20guide')
  expect(links[1].href).toBe('https://steamcommunity.com/app/620/guides/?searchText=Still%20Alive')
})

test('a PSN trophy: YouTube says "trophy", and PSNProfiles finds the game', () => {
  const links = guideLinks('psn', { gameTitle: 'Call of Duty®: Black Ops II', title: 'Old Fashioned' })
  expect(links.map((l) => l.kind)).toEqual(['youtube', 'psnProfiles'])
  expect(links[0].href).toContain('trophy%20guide')
  expect(links[1].href).toBe('https://psnprofiles.com/search/games?q=Call%20of%20Duty%C2%AE%3A%20Black%20Ops%20II')
})

test('no Steam guides without an app id', () => {
  expect(guideLinks('steam', { gameTitle: 'x', title: 'y' }).map((l) => l.kind)).toEqual(['youtube'])
})

test('Xbox gets a YouTube search and TrueAchievements for the game', () => {
  const links = guideLinks('xbox', { gameTitle: 'Halo Infinite', title: 'Seven' })
  expect(links.map((l) => l.kind)).toEqual(['youtube', 'trueAchievements'])
  expect(links[0].href).toContain(encodeURIComponent('Halo Infinite Seven achievement guide'))
  expect(links[1].href).toBe('https://www.trueachievements.com/searchresults.aspx?search=Halo%20Infinite')
})
