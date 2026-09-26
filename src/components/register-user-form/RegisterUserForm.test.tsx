import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterUserForm from './RegisterUserForm'
import { en } from '@/translations/en'

const usernameRule = en.registerForm.usernameRule.replace('{min}', '3').replace('{max}', '20')
const passwordRule = en.registerForm.passwordRule.replace('{min}', '6')

function renderForm() {
  const setIsLogin = jest.fn()
  const setIsRegister = jest.fn()
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setIsRegister} />)
  return { setIsLogin, setIsRegister }
}

function fill({ username = 'ivan', password = 'secret' } = {}) {
  fireEvent.change(screen.getByLabelText(en.registerForm.username), { target: { value: username } })
  fireEvent.change(screen.getByLabelText(en.registerForm.password), { target: { value: password } })
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(en.registerForm.createAccount, 'i') }))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1, username: 'ivan' }) })
})

test('shows the rules for each field before anything is typed', () => {
  renderForm()
  expect(screen.getByText(usernameRule)).toBeInTheDocument()
  expect(screen.getByText(passwordRule)).toBeInTheDocument()
})

test('a username that breaks the rules never reaches the server', () => {
  renderForm()
  fill({ username: 'a b' })
  submit()

  expect(screen.getByLabelText(en.registerForm.username).getAttribute('aria-invalid')).toBe('true')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('a short password never reaches the server', () => {
  renderForm()
  fill({ password: '12345' })
  submit()

  expect(screen.getByLabelText(en.registerForm.password).getAttribute('aria-invalid')).toBe('true')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('an empty form marks every field', () => {
  renderForm()
  submit()
  expect(screen.getAllByText(en.registerForm.required)).toHaveLength(2)
  expect(global.fetch).not.toHaveBeenCalled()
})

test('typing again clears that field’s complaint', () => {
  renderForm()
  submit()
  fireEvent.change(screen.getByLabelText(en.registerForm.username), { target: { value: 'ivan' } })
  expect(screen.getByLabelText(en.registerForm.username).getAttribute('aria-invalid')).toBeNull()
})

test('sends only what the visitor typed: no code, no build-time secret', async () => {
  const { setIsLogin, setIsRegister } = renderForm()
  fill()
  submit()

  await waitFor(() => expect(setIsLogin).toHaveBeenCalledWith(true))
  expect(setIsRegister).toHaveBeenCalledWith(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/users')
  expect(JSON.parse(init.body)).toEqual({ username: 'ivan', password: 'secret' })
})

test('while creating the account the button says so and cannot be pressed again', async () => {
  let release: (value: unknown) => void = () => {}
  ;(global.fetch as jest.Mock).mockReturnValue(new Promise((r) => { release = r }))
  renderForm()
  fill()
  submit()

  const busy = await screen.findByRole('button', { name: new RegExp(en.registerForm.creating) })
  expect(busy).toBeDisabled()
  fireEvent.click(busy)
  expect(global.fetch).toHaveBeenCalledTimes(1)

  release({ ok: true, json: () => Promise.resolve({}) })
})

test('a refusal from the server is reported and the form stays usable', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Username ya en uso' }) })
  const { setIsLogin } = renderForm()
  fill()
  submit()

  expect(await screen.findByRole('alert')).toHaveTextContent('Username ya en uso')
  expect(setIsLogin).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: new RegExp(en.registerForm.createAccount, 'i') })).not.toBeDisabled()
})

test('the sign-in link reads as a link and switches form', () => {
  const { setIsLogin } = renderForm()
  const link = screen.getByRole('button', { name: en.registerForm.alreadyHaveAccountAction })
  expect(link.className).toContain('underline')
  fireEvent.click(link)
  expect(setIsLogin).toHaveBeenCalledWith(true)
})
