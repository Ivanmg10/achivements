import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterUserForm from './RegisterUserForm'

global.fetch = jest.fn()

beforeEach(() => {
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: 1, username: 'ivan' }),
  })
})

test('renders register form', () => {
  render(<RegisterUserForm setIsLogin={jest.fn()} setIsRegister={jest.fn()} />)
  expect(screen.getByText('Register')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
})

test('clicking login button calls setIsLogin(true)', () => {
  const setIsLogin = jest.fn()
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={jest.fn()} />)
  fireEvent.click(screen.getByText('Already have an account? Sign in'))
  expect(setIsLogin).toHaveBeenCalledWith(true)
})

test('does not redirect when api returns error', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: 'Error creating account' }),
  })
  const setIsLogin = jest.fn()
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ivan' } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } })
  fireEvent.click(screen.getByText('Create account'))
  await new Promise((r) => setTimeout(r, 10))
  expect(setIsLogin).not.toHaveBeenCalled()
})

test('submitting form calls API and redirects', async () => {
  const setIsLogin = jest.fn()
  const setIsRegister = jest.fn()
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setIsRegister} />)
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ivan' } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } })
  fireEvent.click(screen.getByText('Create account'))
  await waitFor(() => {
    expect(setIsLogin).toHaveBeenCalledWith(true)
    expect(setIsRegister).toHaveBeenCalledWith(true)
  })
})
