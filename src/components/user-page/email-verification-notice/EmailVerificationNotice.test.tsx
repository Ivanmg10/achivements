import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmailVerificationNotice from './EmailVerificationNotice'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import { en } from '@/translations/en'

jest.mock('@/hooks/useEmailVerification', () => ({ useEmailVerification: jest.fn() }))

const resend = jest.fn()

function state(over: Record<string, unknown> = {}) {
  ;(useEmailVerification as jest.Mock).mockReturnValue({
    unverified: true, outcome: null, resendState: 'idle', resend, ...over,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  state()
})

test('a confirmed address shows nothing at all', () => {
  state({ unverified: false })
  const { container } = render(<EmailVerificationNotice />)
  expect(container).toBeEmptyDOMElement()
})

test('an unconfirmed address is flagged, with a way to send the link again', () => {
  render(<EmailVerificationNotice />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.passwordReset.verifyTitle)
  expect(screen.getByText(en.passwordReset.verifyText)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.passwordReset.verifyResend }))
  expect(resend).toHaveBeenCalled()
})

test('nothing is blocked: it is an alert, not a gate', () => {
  render(<EmailVerificationNotice />)
  // No dialog, no overlay — just a message beside the rest of the page.
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('while sending, the button says so and cannot be pressed again', () => {
  state({ resendState: 'sending' })
  render(<EmailVerificationNotice />)

  const button = screen.getByRole('button', { name: en.passwordReset.verifySending })
  expect(button).toBeDisabled()
})

test('once sent, it says where to look and stops offering', () => {
  state({ resendState: 'sent' })
  render(<EmailVerificationNotice />)

  expect(screen.getByText(en.passwordReset.verifySent)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('a failed send is reported, and can be tried again', () => {
  state({ resendState: 'failed' })
  render(<EmailVerificationNotice />)

  expect(screen.getByText(en.passwordReset.verifyFailed)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.passwordReset.verifyResend })).toBeInTheDocument()
})

test('an expired link explains itself instead of just failing quietly', () => {
  state({ outcome: 'expired' })
  render(<EmailVerificationNotice />)
  expect(screen.getByText(en.passwordReset.verifyExpired)).toBeInTheDocument()
})

test('coming back from a good link is confirmed as success', async () => {
  state({ unverified: false, outcome: 'verified' })
  render(<EmailVerificationNotice />)

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.passwordReset.verifyDone))
})
