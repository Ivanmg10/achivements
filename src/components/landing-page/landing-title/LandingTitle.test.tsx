import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingTitle from './LandingTitle'
import { en } from '@/translations/en'

test('a title screen: the platforms, the name as the h1 with the logo after it, the line under it', () => {
  render(<LandingTitle still={false} onStill={() => {}} />)
  const h1 = screen.getByRole('heading', { level: 1 })
  expect(h1).toHaveTextContent('CheevoVault')
  expect(h1.querySelector('span')!.lastElementChild!.tagName.toLowerCase()).toBe('svg')
  expect(document.body).toHaveTextContent('RetroAchievements, Steam, PlayStation')
  expect(screen.getByText(en.landing.tagline)).toBeInTheDocument()
})

test('the two ways in are the site\'s own buttons: create an account leans, sign in does not', () => {
  render(<LandingTitle still={false} onStill={() => {}} />)
  expect(screen.getByRole('link', { name: en.landing.createAccount }).className).toContain('before:skew-x-(--slant)')
  expect(screen.getByRole('link', { name: en.landing.signIn }).className).not.toContain('skew')
})

test('names the language shown', () => {
  render(<LandingTitle still={false} onStill={() => {}} />)
  expect(screen.getByRole('button', { name: `${en.userConfig.language}: English` })).toBeInTheDocument()
})

test('the stop button reports its state and asks the page to change it', async () => {
  const onStill = jest.fn()
  const { rerender } = render(<LandingTitle still={false} onStill={onStill} />)
  await userEvent.click(screen.getByRole('button', { name: en.landing.stopMotion }))
  expect(onStill).toHaveBeenCalledTimes(1)
  rerender(<LandingTitle still onStill={onStill} />)
  expect(screen.getByRole('button', { name: en.landing.stopMotion })).toHaveAttribute('aria-pressed', 'true')
})
