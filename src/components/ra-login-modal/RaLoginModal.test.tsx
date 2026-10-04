import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { en } from '@/translations/en'
import RaLoginModal from './RaLoginModal'
import { useSession } from 'next-auth/react'

global.fetch = jest.fn()

const mockUpdate = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: {} },
    update: mockUpdate,
  })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ User: 'ivan' }),
  })
  mockUpdate.mockResolvedValue(null)
})

test('does not render when closed', () => {
  const { container } = render(<RaLoginModal isOpen={false} setIsOpen={jest.fn()} />)
  expect(container.firstChild).toBeNull()
})

test('renders form when open', () => {
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />)
  expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
  expect(screen.getByLabelText(en.raLoginModal.apiKey)).toBeInTheDocument()
})

test('submitting with empty fields does nothing', async () => {
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />)
  fireEvent.click(screen.getByText('Sign in'))
  expect(fetch).not.toHaveBeenCalled()
})

test('successful login closes modal', async () => {
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ivan' } })
  fireEvent.change(screen.getByLabelText(en.raLoginModal.apiKey), { target: { value: 'apikey123' } })
  fireEvent.click(screen.getByText('Sign in'))
  await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false))
})

test('closes modal via backdrop (onClose)', () => {
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  // The modal renders on <body>: its backdrop is the last thing there.
  fireEvent.click(document.body.lastElementChild!)
  expect(setIsOpen).toHaveBeenCalledWith(false)
})

function submit(apiKey = 'apikey123') {
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ivan' } })
  fireEvent.change(screen.getByLabelText(en.raLoginModal.apiKey), { target: { value: apiKey } })
  fireEvent.click(screen.getByText('Sign in'))
}

test('sends only the username and key, to the route that asks RA itself, then re-reads the session', async () => {
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  submit()
  await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false))
  expect(fetch).toHaveBeenCalledTimes(1)
  const [url, init] = (fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/updateRaUser')
  expect(JSON.parse(init.body)).toEqual({ username: 'ivan', apiKey: 'apikey123' })
  expect(mockUpdate).toHaveBeenCalledWith()
})

test.each([
  ['ra-invalid', en.raLoginModal.invalid],
  ['key-in-use', en.raLoginModal.keyInUse],
  ['something-else', en.raLoginModal.error],
])('a %s answer is explained inline and the modal stays open', async (code, message) => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: code }) })
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  submit('badkey')
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(setIsOpen).not.toHaveBeenCalled()
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(screen.getByText('Sign in')).toBeInTheDocument()
})

test('says it failed when the network is down, and the button comes back', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />)
  submit()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.raLoginModal.error)
  expect(screen.getByText('Sign in')).toBeInTheDocument()
})

test('says where the RetroAchievements key lives, with a link to it', () => {
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />)
  expect(screen.getByText(en.connect.raKeyPath, { exact: false })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.connect.raKeyHelp }).getAttribute('href')).toBe(
    'https://retroachievements.org/settings',
  )
})
