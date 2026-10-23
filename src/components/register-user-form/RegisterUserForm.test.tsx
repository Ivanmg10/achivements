import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RegisterUserForm from './RegisterUserForm'
import { en } from '@/translations/en'

const usernameRule = en.registerForm.usernameRule.replace('{min}', '3').replace('{max}', '20')
const passwordRule = en.registerForm.passwordRule.replace('{min}', '8')

function renderForm() {
  const setIsLogin = jest.fn()
  const setIsRegister = jest.fn()
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setIsRegister} />)
  return { setIsLogin, setIsRegister }
}

function fill({ username = 'ivan', password = 'secret12', email = 'ivan@test.com' } = {}) {
  fireEvent.change(screen.getByLabelText(en.registerForm.username), { target: { value: username } })
  fireEvent.change(screen.getByLabelText(en.registerForm.password), { target: { value: password } })
  fireEvent.change(screen.getByLabelText(en.passwordReset.email), { target: { value: email } })
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: en.registerForm.createAccount }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(signIn as jest.Mock).mockResolvedValue(undefined)
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
  expect(screen.getAllByText(en.registerForm.required)).toHaveLength(3)
  expect(global.fetch).not.toHaveBeenCalled()
})

test('typing again clears that field’s complaint', () => {
  renderForm()
  submit()
  fireEvent.change(screen.getByLabelText(en.registerForm.username), { target: { value: 'ivan' } })
  expect(screen.getByLabelText(en.registerForm.username).getAttribute('aria-invalid')).toBeNull()
})

test('sends what the visitor typed, email included', async () => {
  const { setIsLogin, setIsRegister } = renderForm()
  fill()
  submit()

  await waitFor(() => expect(setIsLogin).toHaveBeenCalledWith(true))
  expect(setIsRegister).toHaveBeenCalledWith(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/users')
  expect(JSON.parse(init.body)).toEqual({ username: 'ivan', password: 'secret12', email: 'ivan@test.com' })
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
  expect(screen.getByRole('button', { name: en.registerForm.createAccount })).not.toBeDisabled()
})

test('the sign-in link reads as a link and switches form', () => {
  const { setIsLogin } = renderForm()
  const link = screen.getByRole('button', { name: en.registerForm.alreadyHaveAccountAction })
  expect(link.className).toContain('underline')
  fireEvent.click(link)
  expect(setIsLogin).toHaveBeenCalledWith(true)
})

test('an address that is not one never reaches the server', () => {
  renderForm()
  fill({ email: 'not-an-email' })
  submit()
  expect(screen.getByText(en.passwordReset.emailInvalid)).toBeInTheDocument()
  expect(global.fetch).not.toHaveBeenCalled()
})

test('an email that already has an account is explained in the visitor’s language', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'email-taken' }) })
  renderForm()
  fill()
  submit()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.registerForm.emailTaken)
})

test('asks for the email before the password: it is what recovers the account', () => {
  renderForm()
  const order = screen.getAllByRole('textbox').concat(
    Array.from(document.querySelectorAll('input[type="password"]')) as HTMLElement[],
  )
  const labels = Array.from(document.querySelectorAll('label')).map((l) => l.textContent)

  expect(order.length).toBeGreaterThan(0)
  expect(labels).toEqual([
    en.registerForm.username,
    en.passwordReset.email,
    en.registerForm.password,
  ])
})

test('says that signing up accepts the terms and the privacy policy, and links both', () => {
  renderForm()
  expect(screen.getByRole('link', { name: en.terms.link })).toHaveAttribute('href', '/terms')
  expect(screen.getByRole('link', { name: en.privacy.link })).toHaveAttribute('href', '/privacy')
})

test('once the account exists it signs in with what was typed and goes to the welcome', async () => {
  ;(signIn as jest.Mock).mockResolvedValue({ ok: true })
  const { setIsLogin } = renderForm()
  fill()
  submit()

  // Under the curtain first: the page goes once it covers the screen.
  await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith('/welcome'), { timeout: 3000 })
  expect(sessionStorage.getItem('welcome-entry')).toBe('1')
  expect(signIn).toHaveBeenCalledWith('credentials', { username: 'ivan', password: 'secret12', redirect: false })
  expect(setIsLogin).not.toHaveBeenCalled()
})

test('if that sign-in fails, the login form asks for it, as before', async () => {
  ;(signIn as jest.Mock).mockRejectedValue(new Error('offline'))
  const { setIsLogin, setIsRegister } = renderForm()
  fill()
  submit()

  await waitFor(() => expect(setIsLogin).toHaveBeenCalledWith(true))
  expect(setIsRegister).toHaveBeenCalledWith(true)
})

describe('signing up with RetroAchievements', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: string) =>
      Promise.resolve(
        url === '/api/auth/ra/check'
          ? { ok: true, json: () => Promise.resolve({ user: 'PalmeraMiami', avatar: 'https://media.retroachievements.org/UserPic/PalmeraMiami.png' }) }
          : { ok: true, json: () => Promise.resolve({ id: 1, username: 'PalmeraMiami' }) },
      ),
    ) as unknown as typeof fetch
  })

  async function checkRa() {
    fireEvent.click(screen.getByRole('button', { name: en.registerForm.raCta }))
    fireEvent.change(screen.getByLabelText(en.registerForm.raUsername), { target: { value: 'palmeramiami' } })
    fireEvent.change(screen.getByLabelText(en.registerForm.raKey), { target: { value: 'key' } })
    fireEvent.click(screen.getByRole('button', { name: en.registerForm.raCheck }))
    await screen.findByText(en.registerForm.raReady)
  }

  test('the RA account fills the username, and the sign-up links it', async () => {
    renderForm()
    await checkRa()

    expect(screen.getByLabelText(en.registerForm.username)).toHaveValue('PalmeraMiami')
    fireEvent.change(screen.getByLabelText(en.registerForm.password), { target: { value: 'secret12' } })
    fireEvent.change(screen.getByLabelText(en.passwordReset.email), { target: { value: 'ivan@test.com' } })
    submit()

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.anything()))
    const [, init] = (global.fetch as jest.Mock).mock.calls.find(([url]) => url === '/api/users')
    expect(JSON.parse(init.body)).toEqual({
      username: 'PalmeraMiami', password: 'secret12', email: 'ivan@test.com', ra: { username: 'palmeramiami', apiKey: 'key' },
    })
  })

  test('a username already typed is kept', async () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(en.registerForm.username), { target: { value: 'ivan' } })
    await checkRa()
    expect(screen.getByLabelText(en.registerForm.username)).toHaveValue('ivan')
  })

  test('while the RA section is open and unchecked, the account cannot be created; closing it signs up without RA', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: en.registerForm.raCta }))
    expect(screen.getByRole('button', { name: en.registerForm.createAccount })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: en.registerForm.raOff }))
    expect(screen.queryByRole('heading', { name: en.registerForm.raTitle })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.registerForm.createAccount })).toBeEnabled()
  })

  test('a key another account uses is explained when the server refuses it', async () => {
    renderForm()
    await checkRa()
    ;(global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'key-in-use' }) }))
    fireEvent.change(screen.getByLabelText(en.registerForm.password), { target: { value: 'secret12' } })
    fireEvent.change(screen.getByLabelText(en.passwordReset.email), { target: { value: 'ivan@test.com' } })
    submit()
    expect(await screen.findByText(en.raLoginModal.keyInUse)).toBeInTheDocument()
  })
})
