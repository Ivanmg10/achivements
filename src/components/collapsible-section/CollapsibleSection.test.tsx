import { render, screen, fireEvent } from '@testing-library/react'
import CollapsibleSection from './CollapsibleSection'

beforeEach(() => window.localStorage.clear())

test('is a region named by its title, open by default', () => {
  render(<CollapsibleSection title="Steam" count={4}><p>body</p></CollapsibleSection>)

  expect(screen.getByRole('region', { name: 'Steam' })).toBeInTheDocument()
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText('body')).toBeInTheDocument()
  expect(screen.getByText('4')).toBeInTheDocument()
})

test('the toggle is a button inside the heading, controlling the body', () => {
  render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
  const button = screen.getByRole('button')
  expect(button.closest('h2')).not.toBeNull()
  expect(document.getElementById(button.getAttribute('aria-controls')!)).toHaveTextContent('body')
})

test('folds and unfolds, unmounting the body while closed', () => {
  render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
  const button = screen.getByRole('button')

  fireEvent.click(button)
  expect(button.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText('body')).not.toBeInTheDocument()

  fireEvent.click(button)
  expect(screen.getByText('body')).toBeInTheDocument()
})

test('can start closed', () => {
  render(<CollapsibleSection title="Steam" defaultOpen={false}><p>body</p></CollapsibleSection>)
  expect(screen.queryByText('body')).not.toBeInTheDocument()
})

test('omits the count while it is unknown', () => {
  const { container } = render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
  expect(container.querySelector('.tabular-nums')).toBeNull()
})

describe('remembering the state', () => {
  test('saves it under the storage key and restores it on the next visit', () => {
    const { unmount } = render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    fireEvent.click(screen.getByRole('button'))
    expect(window.localStorage.getItem('k')).toBe('closed')
    unmount()

    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    expect(screen.queryByText('body')).not.toBeInTheDocument()
  })

  test('ignores a garbage saved value', () => {
    window.localStorage.setItem('k', 'banana')
    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  test('does not touch storage without a key', () => {
    render(<CollapsibleSection title="Steam"><p>body</p></CollapsibleSection>)
    fireEvent.click(screen.getByRole('button'))
    expect(window.localStorage.length).toBe(0)
  })

  test('still works when storage throws', () => {
    const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    render(<CollapsibleSection title="Steam" storageKey="k"><p>body</p></CollapsibleSection>)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('body')).not.toBeInTheDocument()

    get.mockRestore()
    set.mockRestore()
  })
})
