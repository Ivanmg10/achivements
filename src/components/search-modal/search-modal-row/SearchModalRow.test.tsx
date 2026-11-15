import { fireEvent, render, screen } from '@testing-library/react'
import SearchModalRow from './SearchModalRow'
import SearchModalGroup from '../search-modal-group/SearchModalGroup'

test('the title whole for a screen reader, the match drawn apart for the eye', () => {
  const onSelect = jest.fn()
  render(<SearchModalRow media={null} title="Marvel's Spider-Man" query="spi" sub="PS4 · 73 %" right={<span>tag</span>} onSelect={onSelect} />)
  const row = screen.getByRole('button', { name: /^Marvel's Spider-Man/ })
  expect(row).toHaveAttribute('data-search-option')
  expect(screen.getByText('Spi').tagName).toBe('MARK')
  expect(screen.getByText('PS4 · 73 %')).toBeInTheDocument()
  fireEvent.click(row)
  expect(onSelect).toHaveBeenCalled()
})

test('a group is a named region with its rows and an aside', () => {
  render(<SearchModalGroup title="Your games · 2" aside={<button>Clear</button>}><p>rows</p></SearchModalGroup>)
  expect(screen.getByRole('region', { name: 'Your games · 2' })).toHaveTextContent('rows')
  expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
})
