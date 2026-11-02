import { fireEvent, render, screen } from '@testing-library/react'
import Shelf from './Shelf'

test('a shelf names its group and shows its cards', () => {
  render(<Shelf title="Keep playing" hint="Your latest games"><div>Game card</div></Shelf>)
  expect(screen.getByRole('region', { name: 'Keep playing' })).toBeInTheDocument()
  expect(screen.getByText('Your latest games')).toBeInTheDocument()
  expect(screen.getByText('Game card')).toBeInTheDocument()
})

test('the optional action opens the whole group', () => {
  const onClick = jest.fn()
  render(<Shelf title="Keep playing" action={{ label: 'See 12', onClick }}><div /></Shelf>)
  fireEvent.click(screen.getByRole('button', { name: 'See 12' }))
  expect(onClick).toHaveBeenCalled()
})
