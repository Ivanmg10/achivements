import { fireEvent, render, screen } from '@testing-library/react'
import GroupNewTile from './GroupNewTile'

test('says how many more fit and opens the new group', () => {
  const onClick = jest.fn()
  render(<GroupNewTile view="covers" remaining={7} onClick={onClick} />)
  const button = screen.getByRole('button', { name: /New group/ })
  expect(button).toHaveTextContent('7 left')
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalled()
})
