import { fireEvent, render, screen } from '@testing-library/react'
import BrowseSearchChips from './BrowseSearchChips'

test('a labelled group of toggles that reports the one chosen', () => {
  const onChange = jest.fn()
  render(
    <BrowseSearchChips
      label="Platform"
      value="all"
      onChange={onChange}
      options={[
        { value: 'all', label: 'All' },
        { value: 'ra', label: 'RA' },
      ]}
    />,
  )
  expect(screen.getByRole('group', { name: 'Platform' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'RA' }))
  expect(onChange).toHaveBeenCalledWith('ra')
})
