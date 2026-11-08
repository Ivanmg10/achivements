import { render, screen } from '@testing-library/react'
import AuthPage from './AuthPage'
import { en } from '@/translations/en'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))
jest.mock('@/components/auth-collage-panel/AuthCollagePanel', () => ({ __esModule: true, default: () => null }))

function setViewport(wide: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: wide,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
}

test.each([['a phone', false], ['a desktop', true]])('on %s the sign-in form is mounted once, not once per layout', (_name, wide) => {
  setViewport(wide)
  render(<AuthPage wantsRegister={false} steam={null} />)
  expect(screen.getAllByLabelText(en.loginForm.username, { selector: 'input' })).toHaveLength(1)
  expect(screen.getAllByRole('heading', { name: en.loginForm.title, hidden: true })).toHaveLength(1)
})

test.each([['a phone', false], ['a desktop', true]])('on %s the register form is mounted once too', (_name, wide) => {
  setViewport(wide)
  render(<AuthPage wantsRegister steam={null} />)
  expect(screen.getAllByLabelText(en.registerForm.username, { selector: 'input' })).toHaveLength(1)
})
