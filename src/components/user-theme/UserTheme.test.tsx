import { render, screen, fireEvent, act } from '@testing-library/react'
import UserTheme from './UserTheme'
import { ThemeProvider } from '@/context/ThemeContext'
import { useSession } from 'next-auth/react'

global.fetch = jest.fn()

beforeEach(() => {
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  })
  ;(useSession as jest.Mock).mockReturnValue({
    data: null,
    update: jest.fn(),
  })
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
}

test('renders theme buttons', () => {
  render(<UserTheme />, { wrapper: Wrapper })
  expect(screen.getByText('Theme')).toBeInTheDocument()
})

test('clicking theme button calls fetch', async () => {
  render(<UserTheme />, { wrapper: Wrapper })
  const buttons = screen.getAllByRole('button')
  await act(async () => {
    fireEvent.click(buttons[0])
  })
  expect(fetch).toHaveBeenCalledWith('/api/updateTheme', expect.any(Object))
})

test('reverts theme on fetch error', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  render(<UserTheme />, { wrapper: Wrapper })
  const buttons = screen.getAllByRole('button')
  await act(async () => {
    fireEvent.click(buttons[1])
  })
})
