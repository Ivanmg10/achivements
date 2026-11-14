import { render, screen, fireEvent } from '@testing-library/react'
import CountryList from './CountryList'

const COUNTRIES = [{ code: 'ES', name: 'España' }, { code: 'FR', name: 'Francia' }]

test('lists the given names and reports the pick', () => {
  const onPick = jest.fn()
  render(<CountryList countries={COUNTRIES} onPick={onPick} empty="Nothing" />)
  fireEvent.click(screen.getByRole('button', { name: /Francia/ }))
  expect(onPick).toHaveBeenCalledWith('FR')
})

test('the chosen one is pressed, not by colour alone', () => {
  render(<CountryList countries={COUNTRIES} value="ES" onPick={jest.fn()} empty="Nothing" />)
  expect(screen.getByRole('button', { name: /España/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /Francia/ })).toHaveAttribute('aria-pressed', 'false')
})

test('says so when there is none, and can be disabled', () => {
  const { rerender } = render(<CountryList countries={[]} onPick={jest.fn()} empty="Nothing" />)
  expect(screen.getByText('Nothing')).toBeInTheDocument()
  rerender(<CountryList countries={COUNTRIES} onPick={jest.fn()} empty="Nothing" disabled />)
  expect(screen.getByRole('button', { name: /España/ })).toBeDisabled()
})
