import { render, screen, fireEvent } from '@testing-library/react'
import CategorySearch from './CategorySearch'
import { en } from '@/translations/en'

test('is a labelled search box that reports what is typed', () => {
  const onChange = jest.fn()
  render(<CategorySearch value="" onChange={onChange} />)
  const input = screen.getByLabelText(en.categoryPage.searchGames)
  fireEvent.change(input, { target: { value: 'zelda' } })
  expect(onChange).toHaveBeenCalledWith('zelda')
})

test('clears what is typed, and offers no clear button when empty', () => {
  const onChange = jest.fn()
  const { rerender } = render(<CategorySearch value="" onChange={onChange} />)
  expect(screen.queryByRole('button', { name: en.categoryPage.clearSearch })).not.toBeInTheDocument()

  rerender(<CategorySearch value="zelda" onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: en.categoryPage.clearSearch }))
  expect(onChange).toHaveBeenCalledWith('')
})

test('ties its label to the input, so several boxes can share a page', () => {
  render(<CategorySearch value="" onChange={jest.fn()} id="steam-only-search" />)
  expect(screen.getByLabelText(en.categoryPage.searchGames).getAttribute('id')).toBe('steam-only-search')
})
