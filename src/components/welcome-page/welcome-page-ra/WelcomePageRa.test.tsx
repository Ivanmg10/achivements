import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'
import WelcomePageRa from './WelcomePageRa'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const T = en.welcome
const update = jest.fn()

function renderStep(user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update })
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePageRa {...props} direction="forward" focusTitle={false} />)
  return props
}

function fill(username = 'ivan', key = 'abc123') {
  fireEvent.change(screen.getByLabelText(T.ra.username), { target: { value: username } })
  fireEvent.change(screen.getByLabelText(T.ra.apiKey), { target: { value: key } })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  update.mockResolvedValue(null)
})

test('the form and, beside it, the guide to the key with a link to RA', () => {
  renderStep()
  expect(screen.getByRole('button', { name: T.ra.connect })).toBeDisabled()
  expect(screen.getByRole('complementary', { name: T.ra.guideTitle })).toBeInTheDocument()
  for (const line of T.ra.guide) expect(screen.getByText(line)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: T.ra.openRa })).toHaveAttribute('href', 'https://retroachievements.org/settings')
})

test('linking toasts and moves on', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
  const { onNext } = renderStep()
  fill()
  fireEvent.click(screen.getByRole('button', { name: T.ra.connect }))
  await waitFor(() => expect(onNext).toHaveBeenCalled())
  expect(notify.success).toHaveBeenCalledWith(en.toast.raLinked)
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ username: 'ivan', apiKey: 'abc123' })
})

test('a refused key is said under the field, and the step stays', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'ra-invalid' }) })
  const { onNext } = renderStep()
  fill()
  fireEvent.click(screen.getByRole('button', { name: T.ra.connect }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.raLoginModal.invalid)
  expect(screen.getByLabelText(T.ra.apiKey)).toHaveAttribute('aria-invalid', 'true')
  expect(onNext).not.toHaveBeenCalled()
  // Typing again clears it.
  fireEvent.change(screen.getByLabelText(T.ra.apiKey), { target: { value: 'other' } })
  expect(screen.queryByRole('alert')).toBeNull()
})

test('not now and back', () => {
  const { onSkip, onBack } = renderStep()
  fireEvent.click(screen.getByRole('button', { name: T.notNow }))
  fireEvent.click(screen.getByRole('button', { name: T.back }))
  expect(onSkip).toHaveBeenCalled()
  expect(onBack).toHaveBeenCalled()
})

test('already linked, it says as whom and only goes on', () => {
  const { onNext } = renderStep({ rausername: 'PalmeraMiami' })
  expect(screen.getByText(T.ra.linkedAs.replace('{name}', 'PalmeraMiami'))).toBeInTheDocument()
  expect(screen.queryByLabelText(T.ra.apiKey)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(T.next) }))
  expect(onNext).toHaveBeenCalled()
})

test('came linked (signed up with RA): says as whom, with no form', () => {
  renderStep({ rausername: 'PalmeraMiami' })
  expect(screen.getByText(T.ra.linkedAs.replace('{name}', 'PalmeraMiami'))).toBeInTheDocument()
  expect(screen.queryByLabelText(T.ra.apiKey)).not.toBeInTheDocument()
})
