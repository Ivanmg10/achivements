import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import type { PsnSyncState } from '@/lib/psnSnapshot'
import MainPageProfilePsnSync from './MainPageProfilePsnSync'

const MIN = 60_000
const copy = en.psn.sync

const state = (over: Partial<PsnSyncState> = {}): PsnSyncState => ({
  state: 'syncing',
  stage: 'ready_partial',
  steps: { trophies: 'done', library: 'done', playtime: 'active', history: 'waiting' },
  progress: 48,
  games: { read: 10, total: 40 },
  etaSeconds: 150,
  position: null,
  stale: false,
  trouble: null,
  syncedAt: Date.now() - 3 * MIN,
  nextSyncAt: Date.now() + 7 * MIN,
  pending: { year: 5, total: 30 },
  yearReady: false,
  jobs: [{ phase: 'recent', status: 'running' }],
  ...over,
})

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('when the library was read, and a countdown until the refresh button reads it again', () => {
  const now = Date.now()
  render(<MainPageProfilePsnSync sync={null} syncedAt={now - 3 * MIN} nextSyncAt={now + 7 * MIN} />)
  expect(screen.getByText(/Updated 3 minutes ago/)).toBeInTheDocument()
  expect(screen.getByText(/You can update again in 7:00/)).toBeInTheDocument()
})

test('once a refresh is allowed, only when it was read', () => {
  const now = Date.now()
  render(<MainPageProfilePsnSync sync={null} syncedAt={now - 20 * MIN} nextSyncAt={now - 10 * MIN} />)
  expect(screen.getByText(/Updated 20 minutes ago/)).toBeInTheDocument()
  expect(screen.queryByText(/update again/)).not.toBeInTheDocument()
})

test('a running sync: its line in a live region, the steps in words, a real progress bar and the wait', () => {
  render(<MainPageProfilePsnSync sync={state()} />)
  expect(screen.getByRole('status')).toHaveTextContent(copy.partial)
  expect(screen.getByText(': in progress')).toBeInTheDocument()
  const bar = screen.getByRole('progressbar', { name: copy.progress })
  expect(bar).toHaveAttribute('aria-valuenow', '48')
  expect(bar).toHaveAttribute('aria-valuetext', '48 % done')
  expect(screen.getByText('Ready in about 3 min. You can keep using CheevoVault.')).toBeInTheDocument()
})

test('on a phone the details fold behind a chip that says the share', () => {
  render(<MainPageProfilePsnSync sync={state()} />)
  const chip = screen.getByRole('button', { name: 'Updating PlayStation, 48 %' })
  expect(chip).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('progressbar').parentElement!.className).toContain('max-sm:hidden')
  fireEvent.click(chip)
  expect(chip).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('progressbar').parentElement!.className).not.toContain('max-sm:hidden')
})

test('done: no steps or bar, the live region quiet; paused: the words, no bar', () => {
  const { rerender } = render(<MainPageProfilePsnSync sync={state({ stage: 'ready', progress: 100, etaSeconds: null })} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  rerender(<MainPageProfilePsnSync sync={state({ trouble: 'paused' })} />)
  expect(screen.getByRole('status')).toHaveTextContent(copy.paused)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
