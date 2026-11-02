import { fireEvent, render, screen } from '@testing-library/react'
import MainPagePortada from './MainPagePortada'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { useGameInsights } from '@/hooks/useGameInsights'
import { en } from '@/translations/en'

jest.mock('@/hooks/useRecentFeed', () => ({ useRecentFeed: jest.fn() }))
jest.mock('@/hooks/useGameInsights', () => ({ useGameInsights: jest.fn() }))
jest.mock('@/components/achievement-modal/AchievementModal', () => ({
  __esModule: true,
  default: ({ achievement }: { achievement: { Title: string } }) => <div data-testid="ra-achievement-modal">{achievement.Title}</div>,
}))
jest.mock('@/components/achievement-detail-modal/AchievementDetailModal', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="achievement-modal">{title}</div>,
}))

const steamItem = {
  source: 'steam', key: 's', lastPlayed: null,
  game: { _source: 'steam', id: 620, title: 'Portal 2', consoleName: 'PC', imageIcon: '', maxPossible: 51, numAwarded: 40, pctWon: 78, lastPlayed: null },
}
const raItem = {
  source: 'ra', key: 'r', lastPlayed: null,
  game: { GameID: 7, Title: 'RA Game', ImageIcon: '', ConsoleName: 'SNES', NumPossibleAchievements: 10, NumAchieved: 1, NumAchievedHardcore: 1 },
}
const xboxItem = {
  source: 'xbox', key: 'x', lastPlayed: null,
  game: { _source: 'xbox', id: 9, title: 'Minecraft', consoleName: 'Xbox 360', imageIcon: 'https://icon/xbox.png', maxPossible: 10, numAwarded: 1, pctWon: 10, lastPlayed: null },
}
const target = (title: string, rarity: number) => ({
  id: title, title, description: `About ${title}`, earned: false, earnedAt: null, rarity, points: null, kind: null, iconUrl: `https://img/${title}.png`, href: '#',
})

beforeEach(() => (useGameInsights as jest.Mock).mockReturnValue({ items: [], art: [], loading: false, error: false }))

test('shows the game played last, its console, its progress and the ways in', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  render(<MainPagePortada />)
  expect(screen.getByRole('heading', { name: 'Portal 2' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Portal 2' }).closest('section')).toHaveClass('home-cover')
  expect(screen.getByText('PC')).toBeInTheDocument()
  expect(screen.getByText('40 / 51')).toBeInTheDocument()
  expect(screen.getByText(en.homeLayout.continueKicker)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.homeLayout.openGame })).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

test('names the easiest achievement left, with how many players have it', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [target('Hard one', 2.5), target('Easy one', 43.9)], art: [], loading: false, error: false })
  render(<MainPagePortada />)
  expect(useGameInsights).toHaveBeenCalledWith('steam', 620)
  expect(screen.getByRole('button', { name: 'Easy one' })).toBeInTheDocument()
  expect(screen.getAllByText(/43\.9 % of players have it/)).not.toHaveLength(0)
})

test('shows five grey unearned achievements at most and a matching remaining tile', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: Array.from({ length: 7 }, (_, i) => target(`Target ${i + 1}`, 50 - i)), art: [], loading: false, error: false })
  render(<MainPagePortada />)
  const fifth = screen.getByRole('button', { name: 'Target 5' })
  expect(fifth.firstElementChild).toHaveClass('grayscale')
  expect(screen.queryByRole('button', { name: 'Target 6' })).not.toBeInTheDocument()
  expect(screen.getByRole('tooltip', { name: /Target 5/ })).toHaveTextContent('About Target 5')
  expect(fifth).toHaveAttribute('aria-describedby')
  fireEvent.click(fifth)
  expect(screen.getByTestId('achievement-modal')).toHaveTextContent('Target 5')
  const remaining = screen.getByRole('link', { name: '6 left to unlock' })
  expect(remaining).toHaveTextContent('+6')
  expect(remaining).toHaveAttribute('href', '/steamGame/620')
  expect(remaining).toHaveClass('w-full', 'h-full')
})

test('an RA target opens the same modal as gameInfo', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [raItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [{ ...target('RA target', 50), id: '1' }], art: [], ra: { items: [{ ID: 1, Title: 'RA target' }], players: 100 }, loading: false, error: false })
  render(<MainPagePortada />)
  fireEvent.click(screen.getByRole('button', { name: 'RA target' }))
  expect(screen.getByTestId('ra-achievement-modal')).toHaveTextContent('RA target')
  expect(screen.queryByTestId('achievement-modal')).not.toBeInTheDocument()
})

const artOf = (container: HTMLElement) => container.querySelector('section img')?.getAttribute('src') ?? ''

const art = (container: HTMLElement) => container.querySelector('section img') as HTMLImageElement

/** The picture loads at this real size, in a box as a 2560 px screen gives the cover. */
function load(img: HTMLImageElement, width: number, height: number) {
  Object.defineProperties(img, {
    naturalWidth: { value: width },
    naturalHeight: { value: height },
    clientWidth: { value: 2536 },
    clientHeight: { value: 380 },
  })
  fireEvent.load(img)
}

test('the art that fails to load gives way to the next, and the last to the game picture as a poster', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  const { container } = render(<MainPagePortada />)
  expect(artOf(container)).toContain('library_hero')
  fireEvent.error(art(container))
  expect(artOf(container)).toContain('header.jpg')
  fireEvent.error(art(container))
  // Nothing wide left: the poster is the game's cover, never an empty box.
  expect(artOf(container)).toContain('library_600x900')
})

test('art stays hidden until it has loaded and proved fit, over the tint', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  const { container } = render(<MainPagePortada />)
  const section = container.querySelector('section')!
  expect(art(container)).toHaveClass('opacity-0')
  expect(section.style.backgroundImage).toContain('radial-gradient')
  load(art(container), 1920, 620)
  expect(art(container)).not.toHaveClass('opacity-0')
  expect(section.style.backgroundImage).toBe('')
})

test('art too small for the screen gives way to the next source', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  const { container } = render(<MainPagePortada />)
  load(art(container), 460, 215)
  expect(artOf(container)).toContain('header.jpg')
  expect(art(container)).toHaveClass('opacity-0')
})

test('when nothing fits, the first picture too small for the box is the background, never the poster', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [{ ...raItem, game: { ...raItem.game, ImageIcon: '/Images/icon.png' } }], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://retroachievements.org/Images/ingame.png', 'https://retroachievements.org/Images/title.png'], poster: 'https://retroachievements.org/Images/box.png', loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  load(art(container), 256, 224)
  expect(artOf(container)).toContain('title.png')
  load(art(container), 256, 224)
  expect(artOf(container)).toContain('ingame.png')
  expect(art(container)).not.toHaveClass('opacity-0')
  expect(container.querySelector('img[src*="box.png"]')).toBeNull()
  expect(container.querySelector('section')!.style.backgroundImage).toBe('')
})

test('a fitting IGDB picture wins over RA\'s own', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [raItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://igdb/wide.jpg', 'https://retroachievements.org/Images/ingame.png'], loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  load(art(container), 1600, 800)
  expect(artOf(container)).toBe('https://igdb/wide.jpg')
  expect(art(container)).not.toHaveClass('opacity-0')
})

test('a portrait picture is not cropped into the background: the poster takes over', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [xboxItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://wide/tall.jpg'], loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  load(art(container), 2000, 3000)
  expect(artOf(container)).toBe('https://icon/xbox.png')
})

test('with every source gone it is the game\'s colour alone, and nothing is asked for again', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [xboxItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://wide/broken.jpg'], loading: false, error: false })
  const { container, rerender } = render(<MainPagePortada />)
  fireEvent.error(art(container))
  fireEvent.error(art(container))
  rerender(<MainPagePortada />)
  expect(container.querySelector('section img')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Minecraft' })).toBeInTheDocument()
  const section = container.querySelector('section')!
  expect(section).toHaveClass('min-h-64')
  expect(section.style.backgroundImage).toContain('radial-gradient')
})

test('no poster flashes while a wide picture may still come', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [xboxItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: [], loading: true, error: false })
  const { container } = render(<MainPagePortada />)
  expect(container.querySelector('section img')).toBeNull()
})

test('an Xbox game with no wide picture at all shows IGDB\'s box art before its own tile', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [xboxItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://igdb/broken.jpg'], poster: 'https://igdb/cover.jpg', loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  fireEvent.error(art(container))
  expect(artOf(container)).toBe('https://igdb/cover.jpg')
  fireEvent.error(art(container))
  expect(artOf(container)).toBe('https://icon/xbox.png')
})

test('an RA game with no wide picture at all shows its box art before its small icon', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [{ ...raItem, game: { ...raItem.game, ImageIcon: '/Images/icon.png' } }], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://retroachievements.org/Images/shot.png'], poster: 'https://retroachievements.org/Images/box.png', ra: { items: [], players: 1 }, loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  fireEvent.error(art(container))
  expect(artOf(container)).toContain('box.png')
  fireEvent.error(art(container))
  expect(artOf(container)).toContain('icon.png')
})

test('a wide picture the game page reads (RA, Xbox) comes first', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: ['https://wide/art.png'], loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  expect(artOf(container)).toBe('https://wide/art.png')
})

test('holds its box while loading, and draws nothing without a game', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: true })
  const { container, rerender } = render(<MainPagePortada />)
  expect(container.querySelector('.home-cover .bg-skeleton')).toBeInTheDocument()
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [], loading: false })
  rerender(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
})
