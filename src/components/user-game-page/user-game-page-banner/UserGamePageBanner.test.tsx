import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePageBanner from './UserGamePageBanner'
import { en } from '@/translations/en'

const USER = { username: 'ivan', avatar: 'https://x/a.png', description: null, location: null, ra: 'IvanRA', steam: false, psn: false }

test("whose progress it is, back to their games, and the game's own page", () => {
  render(<UserGamePageBanner user={USER} gamePageHref="/gameInfo/1" comparing={false} onToggleCompare={jest.fn()} />)
  expect(screen.getByRole('link', { name: en.userGame.progressOf.replace('{u}', 'ivan') })).toHaveAttribute('href', '/user/ivan#games')
  expect(screen.getByRole('link', { name: en.userGame.openGamePage })).toHaveAttribute('href', '/gameInfo/1')
})

test('the compare switch says whether it is on', () => {
  const toggle = jest.fn()
  const { rerender } = render(<UserGamePageBanner user={USER} gamePageHref="/" comparing={false} onToggleCompare={toggle} />)
  const button = screen.getByRole('button', { name: en.userProfile.compareWithMe })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(button)
  expect(toggle).toHaveBeenCalled()
  rerender(<UserGamePageBanner user={USER} gamePageHref="/" comparing onToggleCompare={toggle} />)
  expect(button).toHaveAttribute('aria-pressed', 'true')
})

test('no switch on your own page, and a placeholder with no avatar', () => {
  render(<UserGamePageBanner user={{ ...USER, avatar: null }} gamePageHref="/" comparing={false} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
