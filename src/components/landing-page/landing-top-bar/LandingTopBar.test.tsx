import { act, render, screen } from '@testing-library/react'
import LandingTopBar from './LandingTopBar'
import { en } from '@/translations/en'

afterEach(() => Object.defineProperty(window, 'scrollY', { value: 0, configurable: true }))

test('the language, the links and both ways in, at the app bar\'s link size', () => {
  render(<LandingTopBar />)
  expect(screen.getByRole('button', { name: `${en.userConfig.language}: English` })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.rankings.title })).toHaveClass('text-[0.9375rem]', 'font-semibold')
  expect(screen.getByRole('link', { name: en.landing.howPoints })).toHaveAttribute('href', '/rankings/how')
  expect(screen.getByRole('link', { name: en.publicPages.faqTitle })).toHaveAttribute('href', '#faq')
  expect(screen.getByRole('link', { name: en.landing.signIn })).toHaveAttribute('href', '/authPage')
  expect(screen.getByRole('link', { name: en.landing.createAccount })).toHaveAttribute('href', '/authPage?mode=register')
})

test('sticks to the top, clear over the title screen, on its ground once the page has moved', () => {
  const { container } = render(<LandingTopBar />)
  const sticky = container.firstElementChild!
  const bar = sticky.firstElementChild!
  expect(sticky).toHaveClass('sticky', 'top-0')
  expect(bar).not.toHaveClass('backdrop-blur-xl')
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })
    window.dispatchEvent(new Event('scroll'))
  })
  expect(bar).toHaveClass('backdrop-blur-xl')
})
