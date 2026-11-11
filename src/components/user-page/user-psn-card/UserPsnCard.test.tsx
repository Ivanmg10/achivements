jest.mock('@/hooks/usePsnLink', () => ({ usePsnLink: jest.fn() }))
jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn() }))

import { render, screen } from '@testing-library/react'
import UserPsnCard from './UserPsnCard'
import { usePsnLink } from '@/hooks/usePsnLink'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { en } from '@/translations/en'

const link = jest.fn()
const unlink = jest.fn()

function setLink(overrides: Record<string, unknown> = {}) {
  ;(usePsnLink as jest.Mock).mockReturnValue({
    accountId: null, username: null, isLinked: false, link, isLinking: false, error: null, unlink,
    ...overrides,
  })
}

function setSummary(overrides: Record<string, unknown> = {}) {
  ;(usePsnSummary as jest.Mock).mockReturnValue({ summary: null, isLoading: false, error: null, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  setLink()
  setSummary()
})

test('linked: shows the account and its numbers', () => {
  setLink({ accountId: '42', username: 'hakoom', isLinked: true })
  setSummary({
    summary: {
      onlineId: 'Hakoom', avatarUrl: null, trophyLevel: 412, games: 87,
      earned: { bronze: 100, silver: 30, gold: 10, platinum: 3 },
    },
  })
  render(<UserPsnCard />)
  expect(screen.getByText('Hakoom')).toBeInTheDocument()
  expect(screen.getByText('412')).toBeInTheDocument()
  expect(screen.getByText('87')).toBeInTheDocument()
  expect(screen.getByText('143')).toBeInTheDocument()
})

test('linked but unreadable: says why', () => {
  setLink({ accountId: '42', username: 'Hakoom', isLinked: true })
  setSummary({ error: 'private' })
  render(<UserPsnCard />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.errors.private)
})

