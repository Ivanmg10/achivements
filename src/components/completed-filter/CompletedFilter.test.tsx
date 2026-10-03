import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import CompletedFilter from './CompletedFilter'

test('labels come from the translations and the current mode is pressed', () => {
  const onChange = jest.fn()
  render(<CompletedFilter value="hardcore" onChange={onChange} />)
  expect(screen.getByRole('group', { name: en.categoryPage.completedMode })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.categoryPage.hardcore })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.filterAll }))
  expect(onChange).toHaveBeenCalledWith('all')
})
