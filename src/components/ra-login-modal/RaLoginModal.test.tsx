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
  const { container } = render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  fireEvent.click(container.firstChild!)
  expect(setIsOpen).toHaveBeenCalledWith(false)
})

function submit(apiKey = 'apikey123') {
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ivan' } })
  fireEvent.change(screen.getByLabelText(en.raLoginModal.apiKey), { target: { value: apiKey } })
  fireEvent.click(screen.getByText('Sign in'))
}

test('shows RA’s message inline when the name or key is wrong, and stays open', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ message: 'Invalid credentials' }),
  })
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  submit('badkey')
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  expect(setIsOpen).not.toHaveBeenCalled()
  expect(screen.getByText('Sign in')).toBeInTheDocument()
})

test('says it failed when saving the account is refused', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ User: 'ivan' }) })
    .mockResolvedValueOnce({ ok: false, status: 500 })
  const setIsOpen = jest.fn()
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />)
  submit()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.raLoginModal.error)
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(setIsOpen).not.toHaveBeenCalled()
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
