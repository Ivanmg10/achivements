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

test('names the key that jumps to it, only where it does, and only while it is empty', () => {
  const { container, rerender } = render(<CategorySearch value="" onChange={jest.fn()} />)
  expect(container.querySelector('kbd')).toBeNull()
  rerender(<CategorySearch value="" onChange={jest.fn()} shortcut />)
  expect(container.querySelector('kbd')).toHaveTextContent('/')
  expect(container.querySelector('kbd')).toHaveAttribute('aria-hidden', 'true')
  rerender(<CategorySearch value="zelda" onChange={jest.fn()} shortcut />)
  expect(container.querySelector('kbd')).toBeNull()
})

test('is a field that can be seen: long and round like the one of the top bar, outlined, and not tall', () => {
  const { container } = render(<CategorySearch value="" onChange={jest.fn()} />)
  expect(container.firstElementChild).toHaveClass('rounded-full', 'ring-1', 'sm:w-96', 'lg:w-[30rem]', 'py-1.5')
  expect(screen.getByLabelText(en.categoryPage.searchGames)).toHaveClass('text-sm')
})
