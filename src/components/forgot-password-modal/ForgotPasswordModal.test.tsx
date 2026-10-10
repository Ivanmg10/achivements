import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordModal from './ForgotPasswordModal'
import { en } from '@/translations/en'

function open() {
  const onClose = jest.fn()
  render(<ForgotPasswordModal isOpen onClose={onClose} />)
  return { onClose }
}

const ask = (email = 'ivan@test.com') => {
  fireEvent.change(screen.getByLabelText(en.passwordReset.email), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: en.passwordReset.send }))
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
})

test('renders nothing when closed', () => {
  const { container } = render(<ForgotPasswordModal isOpen={false} onClose={jest.fn()} />)
  expect(container.innerHTML).toBe('')
})

test('asks for the address and sends it', async () => {
  open()
  ask()
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.passwordReset.sent))
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/auth/forgotPassword')
  expect(JSON.parse(init.body)).toEqual({ email: 'ivan@test.com' })
})

test('says plainly when email is not set up on the server', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 503,
    json: () => Promise.resolve({ error: 'email-not-configured' }),
  })
  open()
  ask()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.passwordReset.notConfigured)
})

test('reports being throttled', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status: 429,
    json: () => Promise.resolve({ error: 'too-many-requests' }),
  })
  open()
  ask()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.passwordReset.tooMany)
})

test('a network failure is reported', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  open()
  ask()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.passwordReset.failed)
})

test('closes on escape and on the close button', () => {
  const { onClose } = open()
  fireEvent.click(screen.getByLabelText('Close'))
  expect(onClose).toHaveBeenCalled()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(2)
})

test('closing it forgets the address and the outcome, so it opens fresh', async () => {
  const onClose = jest.fn()
  const { rerender } = render(<ForgotPasswordModal isOpen onClose={onClose} />)
  ask()
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.passwordReset.sent))

  rerender(<ForgotPasswordModal isOpen={false} onClose={onClose} />)
  rerender(<ForgotPasswordModal isOpen onClose={onClose} />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByLabelText(en.passwordReset.email)).toHaveValue('')
})
