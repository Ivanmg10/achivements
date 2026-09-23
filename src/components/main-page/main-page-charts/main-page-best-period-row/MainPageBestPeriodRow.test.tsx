import { render, screen, fireEvent } from '@testing-library/react'
import MainPageBestPeriodRow from './MainPageBestPeriodRow'

function row(over: Record<string, unknown> = {}) {
  return (
    <MainPageBestPeriodRow
      label="Best day"
      tone="purple"
      icon={<svg data-testid="icon" />}
      value="120"
      unit="pts"
      when="3 achievements · 2024-01-10"
      onClick={jest.fn()}
      {...over}
    />
  )
}

test('shows the period, when it was and its total, and reports clicks', () => {
  const onClick = jest.fn()
  render(row({ onClick }))
  const button = screen.getByRole('button')
  expect(button).toHaveTextContent('Best day')
  expect(button).toHaveTextContent('3 achievements · 2024-01-10')
  expect(button).toHaveTextContent('120')
  expect(button).toHaveTextContent('pts')
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalled()
})

test('is a plain button unless it expands, and announces its state when it does', () => {
  const { rerender } = render(row())
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBeNull()
  rerender(row({ expanded: false }))
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  rerender(row({ expanded: true }))
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
})
