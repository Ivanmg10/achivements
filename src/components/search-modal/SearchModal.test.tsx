import { render, screen, fireEvent, act, within } from '@testing-library/react'
import SearchModal from './SearchModal'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'
import { useHiddenGames } from '@/context/HiddenGamesContext'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@/hooks/useGameCandidates', () => ({ useGameCandidates: jest.fn() }))
jest.mock('@/hooks/useRaLinked', () => ({ useRaLinked: jest.fn() }))
jest.mock('@/hooks/useRecentFeed', () => ({
  useRecentFeed: () => ({
    feed: [{ source: 'ra', key: 'ra:1', lastPlayed: null, game: { GameID: 1, Title: 'Spider-Man', ConsoleName: 'PS2', ImageIcon: null, NumPossibleAchievements: 74, NumAchieved: 54, NumAchievedHardcore: 54 } }],
    loading: false,
  }),
}))
jest.mock('@/hooks/useStreakData', () => ({ useStreakData: () => ({ activeStreak: { days: 46 } }) }))
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: () => ({ me: { rank: 19, points: 10 } }) }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

function candidate(source: 'ra' | 'steam' | 'psn', id: number, title: string): GameCandidate {
  return {
    key: `${source}:${id}`, source, id, title, subtitle: source === 'ra' ? 'SNES' : source === 'steam' ? 'Steam' : 'PlayStation',
    imageRef: '', pctWon: 0, numAwarded: 0, maxPossible: 0, status: 'in-progress',
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useHiddenGames as jest.Mock).mockReturnValue({ isHidden: () => false })
  localStorage.clear()
  ;(useGameCandidates as jest.Mock).mockReturnValue([candidate('ra', 620, 'Zelda'), candidate('steam', 620, 'Portal 2')])
  ;(useRaLinked as jest.Mock).mockReturnValue(true)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { admin: false } } })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
})

const box = () => screen.getByRole('textbox', { name: en.search.placeholder })
function type(value: string) {
  fireEvent.change(box(), { target: { value } })
}

test('renders nothing when closed, and loads candidates only when open', () => {
  const { container } = render(<SearchModal isOpen={false} onClose={jest.fn()} />)
  expect(container.innerHTML).toBe('')
  expect(useGameCandidates).toHaveBeenCalledWith(false)
})

test('before typing: the games played last, and where to go with your place and streak', () => {
  const onClose = jest.fn()
  render(<SearchModal isOpen onClose={onClose} />)
  const keep = screen.getByRole('region', { name: en.search.continuePlaying })
  expect(within(keep).getByRole('button', { name: /Spider-Man/ })).toBeInTheDocument()
  expect(screen.getByText('you are #19')).toBeInTheDocument()
  expect(screen.getByText('46 days')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Rankings/ }))
  expect(mockPush).toHaveBeenCalledWith('/rankings')
  expect(onClose).toHaveBeenCalled()
})

test('finds RA and Steam games alike, in one group with its count', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('a')
  const games = screen.getByRole('region', { name: `${en.search.yourGames} · 2` })
  expect(within(games).getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
  expect(within(games).getByRole('button', { name: /Portal 2/ })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('2 results')
})

test('what matches is drawn apart', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('port')
  expect(screen.getByText('Port').tagName).toBe('MARK')
  expect(screen.getByRole('button', { name: /^Portal 2/ })).toBeInTheDocument()
})

test('a Steam result opens the Steam game page, and the search is remembered', () => {
  const onClose = jest.fn()
  render(<SearchModal isOpen onClose={onClose} />)
  type('portal')
  fireEvent.click(screen.getByRole('button', { name: /Portal 2/ }))
  expect(mockPush).toHaveBeenCalledWith('/steamGame/620')
  expect(onClose).toHaveBeenCalled()
  expect(JSON.parse(localStorage.getItem('search-recent')!)).toEqual(['portal'])
})

test('a recent search, picked, goes back into the box', () => {
  localStorage.setItem('search-recent', JSON.stringify(['zelda']))
  render(<SearchModal isOpen onClose={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'zelda' }))
  expect(box()).toHaveValue('zelda')
  expect(screen.getByRole('button', { name: /Zelda/ })).toBeInTheDocument()
})

test('an RA result opens the RA game page', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('zelda')
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  expect(mockPush).toHaveBeenCalledWith('/gameInfo/620')
})

test('a pasted id opens that RA game; without an RA account it is not looked up', () => {
  const { unmount } = render(<SearchModal isOpen onClose={jest.fn()} />)
  type('1234')
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.search.openById) }))
  expect(mockPush).toHaveBeenCalledWith('/gameInfo/1234')
  unmount()
  ;(useRaLinked as jest.Mock).mockReturnValue(false)
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('620')
  expect(screen.queryByText(en.search.openById)).not.toBeInTheDocument()
})

test('a hidden game is not offered again through a pasted id', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ isHidden: (id: number, source: string) => source === 'ra' && id === 1234 })
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('1234')
  expect(screen.queryByText(en.search.openById)).not.toBeInTheDocument()
  expect(mockPush).not.toHaveBeenCalled()
})

test('says so when nothing matches', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('xyz')
  expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
})

test('↓ from the box goes to the first row, and Enter opens it', () => {
  render(<SearchModal isOpen onClose={jest.fn()} />)
  type('a')
  fireEvent.keyDown(box(), { key: 'ArrowDown' })
  expect(screen.getByRole('button', { name: /Zelda/ })).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('button', { name: /Zelda/ }), { key: 'ArrowUp' })
  expect(box()).toHaveFocus()
  fireEvent.keyDown(box(), { key: 'Enter' })
  expect(mockPush).toHaveBeenCalledWith('/gameInfo/620')
})

test('says which platforms it searches: no Xbox for who may not see it', () => {
  const { unmount } = render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(/Searches RetroAchievements, Steam, and PlayStation/)).toBeInTheDocument()
  unmount()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { admin: true } } })
  render(<SearchModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(/Xbox/)).toBeInTheDocument()
})

describe('people', () => {
  const onClose = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ username: 'ivan_mg', avatar: null, ra: true, steam: false, psn: true }]),
    })
  })
  afterEach(() => jest.useRealTimers())

  test('not looked up under three letters', () => {
    render(<SearchModal isOpen onClose={onClose} />)
    type('iv')
    act(() => { jest.advanceTimersByTime(500) })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('found beside the games, opening the profile picked, which is remembered', async () => {
    render(<SearchModal isOpen onClose={onClose} />)
    type('ivan')
    await act(async () => { jest.advanceTimersByTime(500) })
    expect(global.fetch).toHaveBeenCalledWith('/api/users/search?q=ivan')
    fireEvent.click(await screen.findByRole('button', { name: /ivan_mg/ }))
    expect(mockPush).toHaveBeenCalledWith('/user/ivan_mg')
    expect(JSON.parse(localStorage.getItem('recent-user-searches')!)).toEqual([{ username: 'ivan_mg', avatar: null }])
  })

  test('nobody matching, and a failed search, are told apart', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    const { unmount } = render(<SearchModal isOpen onClose={onClose} />)
    type('zzz')
    await act(async () => { jest.advanceTimersByTime(500) })
    expect(await screen.findByText(en.publicProfile.noUserFound)).toBeInTheDocument()
    unmount()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
    render(<SearchModal isOpen onClose={onClose} />)
    type('zzz')
    await act(async () => { jest.advanceTimersByTime(500) })
    expect(await screen.findByRole('alert')).toHaveTextContent(en.publicProfile.userLoadError)
  })
})
