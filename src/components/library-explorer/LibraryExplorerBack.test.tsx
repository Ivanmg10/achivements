jest.mock('@/components/library-shelves/LibraryShelves', () => ({ __esModule: true, default: () => <div data-testid="shelves" /> }))
jest.mock('@/components/library-list/LibraryList', () => ({ __esModule: true, default: () => <div data-testid="list" /> }))
jest.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: jest.fn(() => true) }))

import { fireEvent, render, screen } from '@testing-library/react'
import LibraryExplorer from './LibraryExplorer'
import { BackInterceptProvider, useBackRegistry } from '@/context/BackInterceptContext'
import { libraryEntry } from '@/test-utils/libraryFixtures'

/** Stands in for the back button of the top bar. */
function TopBarBack({ onResult }: { onResult: (handled: boolean) => void }) {
  const { tryHandleBack } = useBackRegistry()
  return <button onClick={() => onResult(tryHandleBack())}>top bar back</button>
}

const make = (layout: 'shelves' | 'list') => ({
  category: 'playing', entries: [libraryEntry('steam', 1, 'Hades')], platform: 'all' as const, layout, onLayout: jest.fn(),
  query: '', onQuery: jest.fn(), quick: 'stalled' as const, onQuick: jest.fn(), sort: { key: 'name' as const, dir: 'asc' as const },
  onSort: jest.fn(), selectedKey: null, onSelectKey: jest.fn(),
})

const setup = (layout: 'shelves' | 'list') => {
  const props = make(layout)
  const onResult = jest.fn()
  render(
    <BackInterceptProvider>
      <TopBarBack onResult={onResult} />
      <LibraryExplorer {...props} />
    </BackInterceptProvider>,
  )
  return { props, onResult }
}

beforeEach(() => {
  window.scrollTo = jest.fn()
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => (cb(0), 0))
})
afterEach(() => jest.restoreAllMocks())

test('the list has no button of its own to go back: that is the top bar\'s', () => {
  setup('list')
  expect(screen.queryByRole('button', { name: /shelves/i })).not.toBeInTheDocument()
})

test('in the list, the back of the top bar returns to the shelves, with the filter cleared and the page where it was', () => {
  const { props, onResult } = setup('list')
  fireEvent.click(screen.getByText('top bar back'))
  expect(onResult).toHaveBeenCalledWith(true)
  expect(props.onLayout).toHaveBeenCalledWith('shelves')
  expect(props.onQuick).toHaveBeenCalledWith('all')
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
})

test('on the shelves it takes nothing over: the top bar goes back in the history', () => {
  const { props, onResult } = setup('shelves')
  fireEvent.click(screen.getByText('top bar back'))
  expect(onResult).toHaveBeenCalledWith(false)
  expect(props.onLayout).not.toHaveBeenCalled()
})

test('Escape does the same as the back of the top bar', () => {
  const { props } = setup('list')
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(props.onLayout).toHaveBeenCalledWith('shelves')
})
