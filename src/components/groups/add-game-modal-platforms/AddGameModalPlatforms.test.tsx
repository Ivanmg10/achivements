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
