import { render, screen, fireEvent } from '@testing-library/react'
import CollapsibleSection from './CollapsibleSection'
import { en } from '@/translations/en'

beforeEach(() => window.sessionStorage.clear())

function header() {
  return screen.getByRole('button', { name: /Steam/ })
}

test('is a region named by its title, folded by default', () => {
  render(<CollapsibleSection title="Steam" count={4}><p>body</p></CollapsibleSection>)

  expect(screen.getByRole('region', { name: 'Steam' })).toBeInTheDocument()
  expect(header().getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText('body')).not.toBeInTheDocument()
  expect(screen.getByText('4')).toBeInTheDocument()
})

test('folded, it shows the preview and invites to see every game', () => {
  render(
    <CollapsibleSection title="Steam" count={71} preview={<p>three games</p>}>
      <p>body</p>
    </CollapsibleSection>,
  )
  expect(screen.getByText('three games')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.categoryPage.showAllGames.replace('{n}', '71') }))
  expect(screen.getByText('body')).toBeInTheDocument()
  expect(screen.queryByText('three games')).not.toBeInTheDocument()
  expect(header().getAttribute('aria-expanded')).toBe('true')
})

test('without a count the invitation does not name one', () => {
  render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
  expect(screen.getByRole('button', { name: en.categoryPage.showAll })).toBeInTheDocument()
})

test('the toggle is a button inside the heading, controlling the body', () => {
  render(<CollapsibleSection title="Steam" defaultOpen><p>body</p></CollapsibleSection>)
  const button = header()
  expect(button.closest('h2')).not.toBeNull()
  expect(document.getElementById(button.getAttribute('aria-controls')!)).toHaveTextContent('body')
})

test('folds and unfolds, unmounting the body while closed', () => {
  render(<CollapsibleSection title="Steam" defaultOpen><p>body</p></CollapsibleSection>)

  fireEvent.click(header())
  expect(header().getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText('body')).not.toBeInTheDocument()

  fireEvent.click(header())
  expect(screen.getByText('body')).toBeInTheDocument()
})

test('omits the count while it is unknown', () => {
  const { container } = render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
  expect(container.querySelector('.tabular-nums')).toBeNull()
})

describe('remembering the state for the session', () => {
  test('stays open when coming back in the same session', () => {
    const { unmount } = render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    fireEvent.click(header())
    expect(window.sessionStorage.getItem('k')).toBe('open')
    unmount()

    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  test('does not use long-lived storage, so a new visit starts folded', () => {
    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    fireEvent.click(header())
    expect(window.localStorage.getItem('k')).toBeNull()
  })

  test('ignores a garbage saved value', () => {
    window.sessionStorage.setItem('k', 'banana')
    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    expect(screen.queryByText('body')).not.toBeInTheDocument()
  })

  test('does not touch storage without a key', () => {
    render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
    fireEvent.click(header())
    expect(window.sessionStorage.length).toBe(0)
  })

  test('still works when storage throws', () => {
    const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    fireEvent.click(header())
    expect(screen.getByText('body')).toBeInTheDocument()

    get.mockRestore()
    set.mockRestore()
  })
})
