jest.mock('@/hooks/useXboxLink', () => ({ useXboxLink: jest.fn() }))
jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))

import { render, screen } from '@testing-library/react'
import UserXboxCard from './UserXboxCard'
import { useXboxLink } from '@/hooks/useXboxLink'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const link = jest.fn()
const unlink = jest.fn()

function setLink(overrides: Record<string, unknown> = {}) {
  ;(useXboxLink as jest.Mock).mockReturnValue({
    enabled: true, xuid: null, gamertag: null, isLinked: false, link, isLinking: false, error: null, unlink,
    ...overrides,
  })
}

function setSummary(overrides: Record<string, unknown> = {}) {
  ;(useXboxSummary as jest.Mock).mockReturnValue({ summary: null, isLoading: false, error: null, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  setLink()
  setSummary()
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: false })
})

test('for someone who may not use Xbox it is not there at all', () => {
  setLink({ enabled: false })
  const { container } = render(<UserXboxCard />)
  expect(container).toBeEmptyDOMElement()
})

test('linked: shows the account, that it is admin-only, and its numbers', () => {
  setLink({ xuid: '25354', gamertag: 'testplayer', isLinked: true })
  setSummary({ summary: { gamertag: 'TestPlayer', avatarUrl: null, bio: '', tier: 'Silver', gamerscore: 10242, achievementsUnlocked: 593, games: 135 } })
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    library: [xboxGameFixture({ id: 1, pctWon: 50 }), xboxGameFixture({ id: 2, pctWon: 100 }), xboxGameFixture({ id: 3, pctWon: 0 })],
    libraryLoading: false,
  })
  render(<UserXboxCard />)
  expect(screen.getByText('TestPlayer')).toBeInTheDocument()
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByText('135')).toBeInTheDocument()
  expect(screen.getByText('593')).toBeInTheDocument()
  // The tier is the account's kind ("Account Silver"), and its achievements are labelled like Steam's.
  expect(screen.getByText('Silver').parentElement).toHaveTextContent(en.xbox.tier)
  expect(screen.getByText(en.userStats.achievements)).toBeInTheDocument()
  expect(screen.getByText(en.xbox.adminOnly)).toBeInTheDocument()
  // One game under way of the three.
  expect(screen.getByText(en.steam.playtime).parentElement).toHaveTextContent('—')
})

test('linked but unreadable: says why', () => {
  setLink({ xuid: '25354', gamertag: 'TestPlayer', isLinked: true })
  setSummary({ error: 'rate-limited' })
  render(<UserXboxCard />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.errors['rate-limited'])
})

