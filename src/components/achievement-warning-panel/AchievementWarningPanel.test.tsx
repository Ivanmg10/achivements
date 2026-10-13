import { render, screen, fireEvent } from '@testing-library/react'
import AchievementWarningPanel from './AchievementWarningPanel'

const item = (key: string, onSelect = jest.fn()) => ({ key, title: `T${key}`, description: `D${key}`, iconUrl: null, onSelect })

test('nothing when there is nothing to warn about', () => {
  const { container } = render(<AchievementWarningPanel label="Missable" items={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('folded with its count; opens to the list, and each item opens its achievement', () => {
  const onSelect = jest.fn()
  render(<AchievementWarningPanel label="Missable" items={[item('1', onSelect), item('2')]} />)
  const head = screen.getByRole('button', { name: 'Missable (2)' })
  expect(head).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('T1')).toBeNull()

  fireEvent.click(head)
  expect(head).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(screen.getByRole('button', { name: /T1/ }))
  expect(onSelect).toHaveBeenCalled()
})

test('takes the tone it is given', () => {
  render(<AchievementWarningPanel label="Online" tone="warning" items={[item('1')]} />)
  expect(screen.getByText('Online (1)').className).toContain('text-warning')
})
