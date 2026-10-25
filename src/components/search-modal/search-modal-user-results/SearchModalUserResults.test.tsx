import { render, screen, fireEvent } from '@testing-library/react'
import SearchModalUserResults from './SearchModalUserResults'
import { en } from '@/translations/en'

const IDLE = { results: [], isLoading: false, error: false, active: false }
const FOUND = {
  ...IDLE,
  active: true,
  results: [
    { username: 'ivan', avatar: null, location: 'ES', description: 'Retro fan', ra: true, steam: false, psn: true },
    { username: 'ivy', avatar: 'https://x/a.png', ra: false, steam: true, psn: false },
  ],
}

test('each user with country, a line of their bio and their platforms, under a counted group', () => {
  const onSelect = jest.fn()
  render(<SearchModalUserResults users={FOUND} onSelect={onSelect} />)
  expect(screen.getByRole('region', { name: `${en.search.people} · 2` })).toBeInTheDocument()
  const first = screen.getByRole('button', { name: /ivan/ })
  expect(first).toHaveTextContent('Retro fan')
  expect(first).toHaveAttribute('data-search-option')
  expect(screen.getByRole('img', { name: 'Spain' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'RetroAchievements' })).toBeInTheDocument()
  fireEvent.click(first)
  expect(onSelect).toHaveBeenCalledWith(FOUND.results[0])
})

test('nothing before three letters are typed', () => {
  const { container } = render(<SearchModalUserResults users={IDLE} onSelect={jest.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('looking: shapes; nobody: says so; a failure: an alert', () => {
  const { container, rerender } = render(<SearchModalUserResults users={{ ...FOUND, isLoading: true }} onSelect={jest.fn()} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  rerender(<SearchModalUserResults users={{ ...FOUND, results: [] }} onSelect={jest.fn()} />)
  expect(screen.getByText(en.publicProfile.noUserFound)).toBeInTheDocument()
  rerender(<SearchModalUserResults users={{ ...FOUND, error: true }} onSelect={jest.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userLoadError)
})
