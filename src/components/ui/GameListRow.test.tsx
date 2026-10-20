import { render, screen } from '@testing-library/react'
import { GameListRow } from './GameListRow'

test('a game linking to its page, with its stat', () => {
  render(<GameListRow href="/gameInfo/1" title="Colosseum" subtitle="GameCube" stat="15" statLabel="achievements" />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/gameInfo/1')
  expect(screen.getByText('GameCube')).toBeInTheDocument()
  expect(screen.getByText('15')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('progress is a progress bar named after the game', () => {
  render(<GameListRow href="/x" title="Colosseum" stat="40d" progress={18} />)
  expect(screen.getByRole('progressbar', { name: 'Colosseum' })).toHaveAttribute('aria-valuenow', '18')
})

test('a share is a plain bar, hidden from assistive technology (the stat says the number)', () => {
  const { container } = render(<GameListRow href="/x" title="Colosseum" stat="15" share={60} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  const bar = container.querySelector('[aria-hidden="true"] > span') as HTMLElement
  expect(bar.style.width).toBe('60%')
})

test('the icon is decorative, so a broken one never prints the title over the row', () => {
  const { container } = render(<GameListRow href="/x" imageUrl="https://broken.png" title="Just Cause 2: Multiplayer Mod" stat="2971d" />)
  expect(container.querySelector('img')).toHaveAttribute('alt', '')
  expect(screen.getAllByText('Just Cause 2: Multiplayer Mod')).toHaveLength(1)
})
