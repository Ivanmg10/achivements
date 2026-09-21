import { render, screen, fireEvent } from '@testing-library/react'
import SteamGameImage from './SteamGameImage'

const CDN = 'https://cdn.akamai.steamstatic.com/steam/apps/620'

function img(container: HTMLElement) {
  return container.querySelector('img')
}

test('shows the 600×900 cover by default, not the 32×32 icon', () => {
  const { container } = render(<SteamGameImage appId={620} iconUrl="icon.jpg" size={96} />)
  expect(img(container)?.getAttribute('src')).toBe(`${CDN}/library_600x900.jpg`)
})

test('can request another asset', () => {
  const { container } = render(<SteamGameImage appId={620} asset="hero" size={96} />)
  expect(img(container)?.getAttribute('src')).toBe(`${CDN}/library_hero.jpg`)
})

test('steps down cover → header → icon → placeholder as each fails', () => {
  const { container } = render(<SteamGameImage appId={620} iconUrl="icon.jpg" size={96} />)

  fireEvent.error(img(container)!)
  expect(img(container)?.getAttribute('src')).toBe(`${CDN}/header.jpg`)

  fireEvent.error(img(container)!)
  expect(img(container)?.getAttribute('src')).toBe('icon.jpg')

  fireEvent.error(img(container)!)
  expect(img(container)).toBeNull()
  expect(screen.getByTestId('IconBrandSteam')).toBeInTheDocument()
})

test('does not try the header twice when the header was the request', () => {
  const { container } = render(<SteamGameImage appId={620} asset="header" size={96} />)
  fireEvent.error(img(container)!)
  // No icon given, so straight to the placeholder.
  expect(img(container)).toBeNull()
})

test('a decorative image stays hidden from assistive tech, placeholder included', () => {
  const { container } = render(<SteamGameImage appId={620} asset="header" size={96} />)
  expect(img(container)?.getAttribute('alt')).toBe('')
  fireEvent.error(img(container)!)
  expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
})

test('a labelled image keeps its label on the placeholder', () => {
  const { container } = render(<SteamGameImage appId={620} asset="header" alt="Portal 2" size={96} />)
  fireEvent.error(img(container)!)
  expect(screen.getByRole('img', { name: 'Portal 2' })).toBeInTheDocument()
})

test('passes size and classes through', () => {
  const { container } = render(<SteamGameImage appId={620} size={56} className="rounded-xl" />)
  expect(img(container)?.getAttribute('width')).toBe('56')
  expect(img(container)?.className).toContain('rounded-xl')
  expect(img(container)?.className).toContain('object-cover')
})
