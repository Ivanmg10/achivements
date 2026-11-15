jest.mock('@/hooks/usePsnVerification', () => ({ usePsnVerification: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PsnVerification from './PsnVerification'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

const V = en.psn.verification
const check = jest.fn()
const retry = jest.fn()

function setHook(overrides: Record<string, unknown> = {}) {
  ;(usePsnVerification as jest.Mock).mockReturnValue({
    linked: true, verified: false, code: 'CV-ABCD2345', isLoading: false, loadError: null, retry,
    checking: false, error: null, check, ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
})

test('nothing without a linked account', () => {
  setHook({ linked: false })
  const { container } = render(<PsnVerification onlineId={null} />)
  expect(container).toBeEmptyDOMElement()
})

test('not verified: the code, why it matters, and a link to the PSN profile', () => {
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.getByRole('region', { name: V.title })).toBeInTheDocument()
  expect(screen.getByText('CV-ABCD2345')).toBeInTheDocument()
  expect(screen.getByText(V.counts)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: V.openProfile })).toHaveAttribute('href', 'https://profile.playstation.com/Hakoom')
})

test('the code on its way is the same box in a skeleton, and cannot be checked yet', () => {
  setHook({ isLoading: true, code: null })
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.queryByText('CV-ABCD2345')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: V.check })).toBeDisabled()
  expect(screen.getByRole('button', { name: V.copy })).toBeDisabled()
})

test('a failed read says why, in words, with a retry', () => {
  setHook({ loadError: 'failed', code: null })
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.getByRole('alert')).toHaveTextContent(V.errors.failed)
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})

test('copy puts the code on the clipboard and says so', async () => {
  render(<PsnVerification onlineId="Hakoom" />)
  fireEvent.click(screen.getByRole('button', { name: V.copy }))
  await waitFor(() => expect(screen.getByRole('button', { name: V.copied })).toBeInTheDocument())
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('CV-ABCD2345')
  expect(screen.getAllByRole('status').some((s) => s.textContent === V.copied)).toBe(true)
})

test('a clipboard that refuses is a toast, not silence', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('denied'))
  render(<PsnVerification onlineId="Hakoom" />)
  fireEvent.click(screen.getByRole('button', { name: V.copy }))
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.errorBoundary.copyFailed))
  ;(console.error as jest.Mock).mockRestore()
})

test('checking succeeded: a toast', async () => {
  check.mockResolvedValue(true)
  render(<PsnVerification onlineId="Hakoom" />)
  fireEvent.click(screen.getByRole('button', { name: V.check }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.psnVerified))
})

test('checking failed: no toast, the reason is inline and announced', async () => {
  check.mockResolvedValue(false)
  setHook({ error: 'taken' })
  render(<PsnVerification onlineId="Hakoom" />)
  fireEvent.click(screen.getByRole('button', { name: V.check }))
  await waitFor(() => expect(check).toHaveBeenCalled())
  expect(notify.success).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent(V.errors.taken)
})

test('while it checks the button is busy', () => {
  setHook({ checking: true })
  render(<PsnVerification onlineId="Hakoom" />)
  const button = screen.getByRole('button', { name: V.checking })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('"Later" folds the panel into a line with a button to open it again', () => {
  render(<PsnVerification onlineId="Hakoom" />)
  fireEvent.click(screen.getByRole('button', { name: V.later }))
  expect(screen.queryByText('CV-ABCD2345')).not.toBeInTheDocument()
  expect(screen.getByText(V.unverified)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: V.verify }))
  expect(screen.getByText('CV-ABCD2345')).toBeInTheDocument()
})

test('verified: says so in words, announced politely', () => {
  setHook({ verified: true, code: null })
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.getByRole('status')).toHaveTextContent(V.verified)
  expect(screen.getByRole('status')).toHaveTextContent(V.verifiedNote)
  expect(screen.queryByRole('button', { name: V.check })).not.toBeInTheDocument()
})
