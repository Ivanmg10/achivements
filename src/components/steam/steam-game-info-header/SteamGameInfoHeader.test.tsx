import { render, screen } from '@testing-library/react'
import SteamGameInfoHeader from './SteamGameInfoHeader'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameDetails } from '@/types/steam'

const GAME = toSteamGameProgress({ appid: 377160, name: 'Fallout 4', playtime_forever: 29055, has_community_visible_stats: true })

const DETAILS: SteamGameDetails = {
  appId: 377160,
  name: 'Fallout 4',
  developers: ['Bethesda Game Studios'],
  publishers: ['Bethesda Softworks'],
  genres: ['Rol', 'Acción'],
  releaseDate: '9 NOV 2015',
  description: 'Post-apocalyptic RPG',
  screenshots: [
    { thumb: 't1.jpg', full: 'f1.jpg' },
    { thumb: 't2.jpg', full: 'f2.jpg' },
    { thumb: 't3.jpg', full: 'f3.jpg' },
  ],
}

function renderHeader(props: Partial<React.ComponentProps<typeof SteamGameInfoHeader>> = {}) {
  return render(
    <SteamGameInfoHeader
      appId={377160}
      title="Fallout 4"
      game={GAME}
      details={DETAILS}
      counts={{ earned: 42, total: 84 }}
      {...props}
    />,
  )
}

describe('SteamGameInfoHeader', () => {
  test('shows the cover, title and Steam chip', () => {
    renderHeader()
    expect(screen.getByRole('heading', { level: 1, name: 'Fallout 4' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fallout 4' }).getAttribute('src')).toContain('/377160/library_600x900.jpg')
    expect(screen.getByText('Steam')).toBeInTheDocument()
  })

  test('lists the store facts, like the RA page', () => {
    renderHeader()
    const facts = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(facts).toEqual(expect.arrayContaining([
      `${en.gameInfoPage.id}: 377160`,
      `${en.gameInfoPage.developer}: Bethesda Game Studios`,
      `${en.gameInfoPage.publisher}: Bethesda Softworks`,
      `${en.gameInfoPage.genre}: Rol, Acción`,
      `${en.gameInfoPage.released}: 9 NOV 2015`,
    ]))
    expect(screen.getByText('Post-apocalyptic RPG')).toBeInTheDocument()
  })

  test('falls back to dashes when the store has no entry', () => {
    renderHeader({ details: null })
    const facts = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(facts).toContain(`${en.gameInfoPage.developer}: —`)
    expect(facts).toContain(`${en.gameInfoPage.released}: —`)
    expect(screen.queryByRole('img', { name: /Screenshot/ })).not.toBeInTheDocument()
  })

  test('shows achievement and playtime badges', () => {
    renderHeader()
    const achievementsBadge = screen.getByText(en.gameInfoPage.achievements).parentElement!
    expect(achievementsBadge).toHaveTextContent('42 / 84')
    const playtimeBadge = screen.getByText(en.steam.playtime).parentElement!
    expect(playtimeBadge).toHaveTextContent('484 h')
  })

  test('marks an unfinished game in progress and a finished one perfect', () => {
    const { rerender } = renderHeader()
    expect(screen.getByText(en.gameStatus.inProgress)).toBeInTheDocument()
    expect(screen.queryByText(`★ ${en.steam.perfect}`)).not.toBeInTheDocument()

    rerender(
      <SteamGameInfoHeader appId={377160} title="Fallout 4" game={GAME} details={DETAILS} counts={{ earned: 84, total: 84 }} />,
    )
    expect(screen.getByText(`★ ${en.steam.perfect}`)).toBeInTheDocument()
    expect(screen.queryByText(en.gameStatus.inProgress)).not.toBeInTheDocument()
  })

  test('shows neither status before any achievement is earned', () => {
    renderHeader({ counts: { earned: 0, total: 84 } })
    expect(screen.queryByText(en.gameStatus.inProgress)).not.toBeInTheDocument()
    expect(screen.queryByText(`★ ${en.steam.perfect}`)).not.toBeInTheDocument()
  })

  test('omits the bar and achievement badge until counts are known, or for a game without any', () => {
    const { rerender } = renderHeader({ counts: null })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(en.gameInfoPage.achievements)).not.toBeInTheDocument()

    rerender(<SteamGameInfoHeader appId={1} title="X" game={GAME} details={null} counts={{ earned: 0, total: 0 }} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('says so, and shows no playtime, for a game not in the library', () => {
    renderHeader({ game: null })
    expect(screen.getByText(en.steam.notOwned)).toBeInTheDocument()
    expect(screen.queryByText(en.steam.playtime)).not.toBeInTheDocument()
  })

  test('links to the store page in a new tab', () => {
    renderHeader()
    const link = screen.getByRole('link', { name: en.steam.viewOnSteam })
    expect(link.getAttribute('href')).toBe('https://store.steampowered.com/app/377160')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
})
