import { fireEvent, render, screen } from '@testing-library/react'
import SteamSignupForm from './SteamSignupForm'
import { useSteamSignup } from '@/hooks/useSteamSignup'
import { en } from '@/translations/en'

jest.mock('@/hooks/useSteamSignup', () => ({ useSteamSignup: jest.fn() }))

const register = jest.fn()
function hook(value: Partial<ReturnType<typeof useSteamSignup>>) {
  ;(useSteamSignup as jest.Mock).mockReturnValue({ submitting: false, submitError: null, register, ...value })
}

const PROFILE = { persona: 'Gabe Newell', avatar: 'https://avatars.steamstatic.com/a.jpg', username: 'Gabe_Newell' }

beforeEach(() => jest.clearAllMocks())

test('says it is signing in while it checks', () => {
  hook({ state: { status: 'loading' } })
  render(<SteamSignupForm outcome="1" />)
  expect(screen.getByRole('status')).toHaveTextContent(en.steamAuth.checking)
})

test('an error is named, with a way to try again and a way back', () => {
  hook({ state: { status: 'error', error: 'expired' } })
  render(<SteamSignupForm outcome="1" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.steamAuth.expired)
  expect(screen.getByRole('link', { name: en.steamAuth.tryAgain })).toHaveAttribute('href', '/api/auth/steam')
  expect(screen.getByRole('link', { name: en.steamAuth.back })).toHaveAttribute('href', '/authPage')
})

test('the form starts from the Steam name and asks for an email', () => {
  hook({ state: { status: 'form', profile: PROFILE } })
  render(<SteamSignupForm outcome="1" />)

  expect(screen.getByText('Gabe Newell')).toBeInTheDocument()
  expect(screen.getByLabelText(en.registerForm.username)).toHaveValue('Gabe_Newell')

  fireEvent.click(screen.getByRole('button', { name: en.steamAuth.create }))
  expect(register).not.toHaveBeenCalled()
  expect(screen.getByText(en.registerForm.required)).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText(en.passwordReset.email), { target: { value: ' gabe@test.com ' } })
  fireEvent.click(screen.getByRole('button', { name: en.steamAuth.create }))
  expect(register).toHaveBeenCalledWith('Gabe_Newell', 'gabe@test.com')
})

test('a refusal from the server shows next to the form', () => {
  hook({ state: { status: 'form', profile: PROFILE }, submitError: 'username-taken' })
  render(<SteamSignupForm outcome="1" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.steamAuth.usernameTaken)
})
