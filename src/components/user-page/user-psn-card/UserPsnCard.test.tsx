jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/hooks/usePsnLink', () => ({ usePsnLink: jest.fn() }))
jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn() }))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserPsnCard from './UserPsnCard'
import { usePsnLink } from '@/hooks/usePsnLink'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

const link = jest.fn()
const unlink = jest.fn()

function setLink(overrides: Record<string, unknown> = {}) {
  ;(usePsnLink as jest.Mock).mockReturnValue({
    accountId: null, username: null, isLinked: false, link, isLinking: false, error: null, unlink, isUnlinking: false,
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

test('not linked: says what linking is for and asks for the online ID', () => {
  render(<UserPsnCard />)
  expect(screen.getByText(en.psn.connectHint)).toBeInTheDocument()
  expect(screen.getByLabelText(en.psn.usernameLabel)).toBeInTheDocument()
})

test('a successful link is announced with a toast', async () => {
  link.mockResolvedValue(true)
  render(<UserPsnCard />)
  fireEvent.change(screen.getByLabelText(en.psn.usernameLabel), { target: { value: 'Hakoom' } })
  fireEvent.click(screen.getByRole('button', { name: en.psn.connect }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.psnLinked))
  expect(link).toHaveBeenCalledWith('Hakoom')
})

test('a failed link is shown in the card, not as a toast', async () => {
  setLink({ error: 'private' })
  render(<UserPsnCard />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.errors.private)
  expect(notify.error).not.toHaveBeenCalled()
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

test('unlinking says how it went', async () => {
  setLink({ accountId: '42', username: 'Hakoom', isLinked: true })
  unlink.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
  render(<UserPsnCard />)
  const button = screen.getByRole('button', { name: en.psn.disconnect })

  fireEvent.click(button)
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.psnUnlinked))
  fireEvent.click(button)
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.unlinkFailed))
})
