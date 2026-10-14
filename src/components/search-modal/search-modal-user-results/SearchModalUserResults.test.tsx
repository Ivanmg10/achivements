import { createRef } from 'react'
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

function setup(users = FOUND as typeof FOUND, recent = [] as { username: string; avatar: string | null }[]) {
  const onSelect = jest.fn()
  const onClearRecent = jest.fn()
  const inputRef = createRef<HTMLInputElement>()
  render(
    <>
      <input ref={inputRef} aria-label="search" />
      <SearchModalUserResults users={users} recent={recent} onClearRecent={onClearRecent} onSelect={onSelect} listRef={createRef()} inputRef={inputRef} />
    </>,
  )
  return { onSelect, onClearRecent }
}

test('each user with country, a line of their bio and their platforms', () => {
  const { onSelect } = setup()
  const first = screen.getByRole('button', { name: /ivan/ })
  expect(first).toHaveTextContent('Retro fan')
  expect(screen.getByRole('img', { name: 'Spain' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'RetroAchievements' })).toBeInTheDocument()
  fireEvent.click(first)
  expect(onSelect).toHaveBeenCalledWith(FOUND.results[0])
})

test('the arrows move through the results, and up from the first returns to the search box', () => {
  setup()
  const [a, b] = screen.getAllByRole('button')
  a.focus()
  fireEvent.keyDown(a, { key: 'ArrowDown' })
  expect(b).toHaveFocus()
  fireEvent.keyDown(b, { key: 'ArrowDown' })
  expect(b).toHaveFocus()
  fireEvent.keyDown(b, { key: 'ArrowUp' })
  expect(a).toHaveFocus()
  fireEvent.keyDown(a, { key: 'ArrowUp' })
  expect(screen.getByLabelText('search')).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('list'), { key: 'a' })
})

test('before typing, the profiles opened lately, which can be cleared', () => {
  const { onSelect, onClearRecent } = setup(IDLE as typeof FOUND, [{ username: 'old', avatar: null }])
  expect(screen.getByText(en.userSearch.recent)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'old' }))
  expect(onSelect).toHaveBeenCalledWith({ username: 'old', avatar: null })
  fireEvent.click(screen.getByRole('button', { name: en.userSearch.clearRecent }))
  expect(onClearRecent).toHaveBeenCalled()
  expect(screen.getByText(en.publicProfile.searchUsersHint)).toBeInTheDocument()
})

test('with nothing recent, just the hint', () => {
  setup(IDLE as typeof FOUND)
  expect(screen.queryByText(en.userSearch.recent)).not.toBeInTheDocument()
  expect(screen.getByText(en.publicProfile.searchUsersHint)).toBeInTheDocument()
})

test('placeholders while searching', () => {
  setup({ ...FOUND, isLoading: true })
  expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('a failure is an alert', () => {
  setup({ ...FOUND, error: true })
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userLoadError)
})

test('no match says so', () => {
  setup({ ...FOUND, results: [] })
  expect(screen.getByText(en.publicProfile.noUserFound)).toBeInTheDocument()
})
