import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginUserForm from './LoginUserForm'
import { signIn } from 'next-auth/react'
import { en } from '@/translations/en'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: mockRefresh }) }))

function renderForm(isRegister = false) {
  const setIsLogin = jest.fn()
  render(<LoginUserForm setIsLogin={setIsLogin} isRegister={isRegister} />)
  return { setIsLogin }
}

const fill = (username = 'ivan', password = 'secret') => {
  fireEvent.change(screen.getByLabelText(en.loginForm.username), { target: { value: username } })
  fireEvent.change(screen.getByLabelText(en.loginForm.password), { target: { value: password } })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(signIn as jest.Mock).mockResolvedValue({ ok: true })
})

test('labels both fields, so they stay named once filled in', () => {
  renderForm()
  expect(screen.getByRole('heading', { name: en.loginForm.title })).toBeInTheDocument()
  expect(screen.getByLabelText(en.loginForm.username)).toBeInTheDocument()
  expect(screen.getByLabelText(en.loginForm.password)).toBeInTheDocument()
})

test('says the account was created when arriving from register', () => {
  renderForm(true)
  expect(screen.getByRole('status')).toHaveTextContent(en.loginForm.accountCreated)
})

test('the register link reads as a link and switches form', () => {
  const { setIsLogin } = renderForm()
  const link = screen.getByRole('button', { name: en.loginForm.noAccountAction })
  expect(link.className).toContain('underline')
  fireEvent.click(link)
  expect(setIsLogin).toHaveBeenCalledWith(false)
})

test('an empty form says what is missing instead of calling the server', () => {
  renderForm()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))
  expect(screen.getByRole('alert')).toHaveTextContent(en.loginForm.missingFields)
  expect(signIn).not.toHaveBeenCalled()
})

test('signs in and goes home', async () => {
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ username: 'ivan', redirect: false }))
})

test('while signing in the button says so and cannot be pressed again', async () => {
  let release: (value: { ok: boolean }) => void = () => {}
  ;(signIn as jest.Mock).mockReturnValue(new Promise((r) => { release = r }))
  renderForm()
  fill()

  const button = screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') })
  fireEvent.click(button)

  const busy = await screen.findByRole('button', { name: new RegExp(en.loginForm.signingIn) })
  expect(busy).toBeDisabled()
  fireEvent.click(busy)
  expect(signIn).toHaveBeenCalledTimes(1)

  release({ ok: true })
})

test('wrong credentials leave the form usable again', async () => {
  ;(signIn as jest.Mock).mockResolvedValue({ ok: false })
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))

  expect(await screen.findByRole('alert')).toHaveTextContent(en.loginForm.invalidCredentials)
  expect(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') })).not.toBeDisabled()
  expect(mockPush).not.toHaveBeenCalled()
})

test('a network failure is reported rather than leaving it spinning', async () => {
  ;(signIn as jest.Mock).mockRejectedValue(new Error('offline'))
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') })).not.toBeDisabled()
})

test('a wrong password says so', async () => {
  ;(signIn as jest.Mock).mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.loginForm.invalidCredentials)
  expect(mockPush).not.toHaveBeenCalled()
})

test('when the server has had too many failures, it says to wait instead of blaming the password', async () => {
  ;(signIn as jest.Mock).mockResolvedValue({ ok: false, error: 'too-many-attempts' })
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.loginForm.signIn, 'i') }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.loginForm.tooManyAttempts)
})
