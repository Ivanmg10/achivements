import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import LocationModal from './LocationModal'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const update = jest.fn()
const answer = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(body) })
const search = () => screen.getByRole('textbox', { name: en.userData.searchCountry })

function setup(props: Partial<React.ComponentProps<typeof LocationModal>> = {}) {
  const onClose = jest.fn()
  render(<LocationModal isOpen onClose={onClose} {...props} />)
  return { onClose }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ update })
  update.mockResolvedValue(undefined)
  global.fetch = jest.fn().mockImplementation(() => answer({ ok: true }))
})

test('renders nothing while closed', () => {
  render(<LocationModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

test('lists the countries, and filters by name or by code', () => {
  setup()
  expect(screen.getByRole('button', { name: /Spain/ })).toBeInTheDocument()
  fireEvent.change(search(), { target: { value: 'spa' } })
  expect(screen.getByRole('button', { name: /Spain/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /France/ })).not.toBeInTheDocument()
  fireEvent.change(search(), { target: { value: 'FR' } })
  expect(screen.getByRole('button', { name: /France/ })).toBeInTheDocument()
})

test('says so when nothing matches', () => {
  setup()
  fireEvent.change(search(), { target: { value: 'zzzzzz' } })
  expect(screen.getByText(en.userData.noResults)).toBeInTheDocument()
})

test('the current country is marked as pressed, and not by colour alone', () => {
  setup({ currentCode: 'ES' })
  expect(screen.getByRole('button', { name: /Spain/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /France/ })).toHaveAttribute('aria-pressed', 'false')
})

test('choosing one saves it, refreshes the session, says so and closes', async () => {
  const { onClose } = setup()
  fireEvent.click(screen.getByRole('button', { name: /France/ }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  const [url, init] = (fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/updateUserProfile')
  expect(JSON.parse(init.body)).toEqual({ field: 'location', value: 'FR' })
  expect(update).toHaveBeenCalled()
  expect(notify.success).toHaveBeenCalledWith(en.toast.saved)
})

test('a refusal is shown inline, in an alert, and the modal stays open', async () => {
  ;(fetch as jest.Mock).mockImplementation(() => answer({ error: 'Not a country' }, false))
  const { onClose } = setup()
  fireEvent.click(screen.getByRole('button', { name: /France/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Not a country')
  expect(onClose).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
  expect(notify.success).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /France/ })).toBeEnabled()
})

test('a refusal with no message falls back to the generic one', async () => {
  ;(fetch as jest.Mock).mockImplementation(() => answer({}, false))
  setup()
  fireEvent.click(screen.getByRole('button', { name: /France/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.editProfileModal.errorGeneric)
})

test('a network failure falls back to the generic message too', async () => {
  ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  setup()
  fireEvent.click(screen.getByRole('button', { name: /France/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.editProfileModal.errorGeneric)
})

test('closing clears the search and any error', async () => {
  ;(fetch as jest.Mock).mockImplementation(() => answer({ error: 'Nope' }, false))
  const onClose = jest.fn()
  const { rerender } = render(<LocationModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: /France/ }))
  await screen.findByRole('alert')
  fireEvent.change(search(), { target: { value: 'spa' } })
  fireEvent.click(document.querySelector('.fixed.inset-0') as HTMLElement)
  expect(onClose).toHaveBeenCalled()
  rerender(<LocationModal isOpen={false} onClose={onClose} />)
  rerender(<LocationModal isOpen onClose={onClose} />)
  expect(search()).toHaveValue('')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
