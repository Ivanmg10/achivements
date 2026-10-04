import { fireEvent, render, screen } from '@testing-library/react'
import MainPageGroupsRow from './MainPageGroupsRow'

test('without onSelect it links to the group', () => {
  render(<MainPageGroupsRow href="/groups/4" selected={false}>Pokémon</MainPageGroupsRow>)
  expect(screen.getByRole('link', { name: 'Pokémon' })).toHaveAttribute('href', '/groups/4')
})

test('with onSelect it is a toggle that says whether it is the one shown', () => {
  const onSelect = jest.fn()
  render(<MainPageGroupsRow href="/groups/4" selected onSelect={onSelect}>Pokémon</MainPageGroupsRow>)
  const row = screen.getByRole('button', { name: 'Pokémon' })
  expect(row).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(row)
  expect(onSelect).toHaveBeenCalled()
})
