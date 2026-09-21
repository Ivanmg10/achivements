import { render, screen } from '@testing-library/react'
import SteamOnlineBadge from './SteamOnlineBadge'
import { en } from '@/translations/en'

test('says it is a guess, in text and on hover', () => {
  const { container } = render(<SteamOnlineBadge />)
  expect(screen.getByText(en.steam.likelyOnline)).toBeInTheDocument()
  expect(screen.getByText(`: ${en.steam.likelyOnlineHint}`)).toHaveClass('sr-only')
  expect(container.firstElementChild?.getAttribute('title')).toBe(en.steam.likelyOnlineHint)
})
