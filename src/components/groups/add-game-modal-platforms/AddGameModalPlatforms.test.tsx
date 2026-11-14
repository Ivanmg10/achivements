import { fireEvent, render, screen } from '@testing-library/react'
import AddGameModalPlatforms from './AddGameModalPlatforms'

test('all, then each platform; the current one pressed', () => {
  const onChange = jest.fn()
  render(<AddGameModalPlatforms sources={['ra', 'steam']} value={null} onChange={onChange} />)
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: /Steam/ }))
  expect(onChange).toHaveBeenCalledWith('steam')
  expect(screen.getByRole('button', { name: /RetroAchievements/ })).toBeInTheDocument()
})

test('the chips are one row that scrolls sideways, never two rows (#165, H2)', () => {
  render(<AddGameModalPlatforms sources={['ra', 'steam', 'psn']} value={null} onChange={jest.fn()} />)
  const row = screen.getByRole('group')
  expect(row).toHaveClass('overflow-x-auto')
  expect(row).not.toHaveClass('flex-wrap')
})
