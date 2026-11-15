import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'
import { usePsnLink } from '@/hooks/usePsnLink'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import WelcomePagePsn from './WelcomePagePsn'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/hooks/usePsnLink', () => ({ usePsnLink: jest.fn() }))
jest.mock('@/hooks/usePsnVerification', () => ({ usePsnVerification: jest.fn() }))

const T = en.welcome
const link = jest.fn()

function renderStep(state: Record<string, unknown> = {}) {
  ;(usePsnLink as jest.Mock).mockReturnValue({ isLinked: false, username: null, link, isLinking: false, error: null, ...state })
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePagePsn {...props} direction="back" focusTitle={false} />)
  return props
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(usePsnVerification as jest.Mock).mockReturnValue({
    linked: true, verified: false, code: 'CV-ABCD2345', isLoading: false, loadError: null, retry: jest.fn(), checking: false, error: null, check: jest.fn(),
  })
})

test('links by online ID, toasts and stays, to show it linked', async () => {
  link.mockResolvedValue(true)
  const { onNext } = renderStep()
  fireEvent.change(screen.getByLabelText(en.psn.usernameLabel), { target: { value: ' Kirby_92 ' } })
  fireEvent.click(screen.getByRole('button', { name: T.psn.connect }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.psnLinked))
  expect(link).toHaveBeenCalledWith('Kirby_92')
  expect(onNext).not.toHaveBeenCalled()
})

test('a refusal is said under the box', () => {
  renderStep({ error: 'private' })
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.errors.private)
  expect(screen.getByLabelText(en.psn.usernameLabel)).toHaveAttribute('aria-invalid', 'true')
})

test('nothing is sent with an empty box, and not now skips', () => {
  const { onSkip } = renderStep()
  expect(screen.getByRole('button', { name: T.psn.connect })).toBeDisabled()
  fireEvent.submit(screen.getByLabelText(en.psn.usernameLabel).closest('form')!)
  expect(link).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: T.notNow }))
  expect(onSkip).toHaveBeenCalled()
})

test('already linked, it only goes on', () => {
  const { onNext } = renderStep({ isLinked: true, username: 'Kirby_92' })
  expect(screen.getByText(T.ra.linkedAs.replace('{name}', 'Kirby_92'))).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.next) }))
  expect(onNext).toHaveBeenCalled()
})

test('linked: offers verifying it, optional, and going on is never blocked by it', () => {
  const { onNext } = renderStep({ isLinked: true, username: 'Kirby_92' })
  expect(screen.getByText(T.psn.verify)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.psn.verification.verify })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.next) }))
  expect(onNext).toHaveBeenCalled()
})

test('not linked yet: no verification to offer', () => {
  renderStep()
  expect(screen.queryByText(T.psn.verify)).not.toBeInTheDocument()
})
