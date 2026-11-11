import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import GameTableState from './game-table-state/GameTableState'
import GamePageNotLinked from './game-page-not-linked/GamePageNotLinked'
import GamePageLibraryError from './game-page-library-error/GamePageLibraryError'
import UserGameCompareBody from '@/components/user-game-page/user-game-compare-body/UserGameCompareBody'
import UserGameNotInList from '@/components/user-game-page/user-game-not-in-list/UserGameNotInList'

const onRetry = jest.fn()

const table = (o: Partial<Parameters<typeof GameTableState>[0]> = {}) =>
  render(
    <GameTableState isLoading={false} failed={false} errorText="Could not read" retryLabel="Retry" onRetry={onRetry} emptyText="Nothing here" isEmpty={false} {...o}>
      <p>the table</p>
    </GameTableState>,
  )

beforeEach(() => jest.clearAllMocks())

describe('GameTableState', () => {
  test('a skeleton while it loads, announced, and nothing else', () => {
    table({ isLoading: true, failed: true, isEmpty: true })
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(en.loadingPage.game)).toBeInTheDocument()
    expect(screen.queryByText('the table')).not.toBeInTheDocument()
  })

  test('a failure says why, adds its hint and asks again on retry', () => {
    table({ failed: true, hint: 'It is private' })
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read')
    expect(screen.getByText('It is private')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('no hint, no second line', () => {
    table({ failed: true, hint: null })
    expect(screen.getByRole('alert').parentElement?.querySelectorAll('p')).toHaveLength(1)
  })

  test('a game with nothing in it says so, without a retry', () => {
    table({ isEmpty: true })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('otherwise the table', () => {
    table()
    expect(screen.getByText('the table')).toBeInTheDocument()
  })
})

test('not linked: says which platform and points to the account page', () => {
  render(<GamePageNotLinked platform="Xbox" connectLabel="Connect Xbox" />)
  expect(screen.getByText(`Xbox · ${en.userData.notConnected}`)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Connect Xbox' })).toHaveAttribute('href', '/user')
})

test('a library that could not be read: why, and a retry', () => {
  render(<GamePageLibraryError title="Could not load" reason="Try later" retryLabel="Retry" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  expect(screen.getByText('Try later')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalled()
})

describe('UserGameCompareBody', () => {
  const body = (o: Partial<Parameters<typeof UserGameCompareBody>[0]> = {}) =>
    render(
      <UserGameCompareBody background={<i data-testid="bg" />} banner={<b>banner</b>} header={<h1>header</h1>} username="ana" onRetry={onRetry} {...o}>
        <p>comparison</p>
      </UserGameCompareBody>,
    )

  test('art, banner and header, then the comparison', () => {
    body()
    expect(screen.getByTestId('bg')).toBeInTheDocument()
    expect(screen.getByText('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'header' })).toBeInTheDocument()
    expect(screen.getByText('comparison')).toBeInTheDocument()
  })

  test('while their list loads, a skeleton and not the comparison', () => {
    body({ isLoading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('comparison')).not.toBeInTheDocument()
  })

  test('when it fails, names the user, adds the hint and retries', () => {
    body({ failed: true, hint: 'Private profile' })
    expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.loadError.replace('{u}', 'ana'))
    expect(screen.getByText('Private profile')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
    expect(onRetry).toHaveBeenCalled()
  })
})

test('a game outside their list: your banner and a line naming them', () => {
  render(<UserGameNotInList banner={<b>banner</b>} username="ana" />)
  expect(screen.getByText('banner')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.notInTheirList.replace('{u}', 'ana'))
})
