import { render, screen } from '@testing-library/react'
import MainPageProfileCard from './MainPageProfileCard'

test('the name, the lines under it, the actions and the figures', () => {
  render(
    <MainPageProfileCard avatarSrc="a.png" avatarFallback={<span>mark</span>} ring="#66c0f4" name="Palmera" actions={<button>Refresh</button>} stats={<span>stats</span>}>
      <p>Member since 2023</p>
    </MainPageProfileCard>,
  )
  expect(screen.getByText('Palmera')).toHaveClass('font-display')
  expect(screen.getByText('Member since 2023')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  expect(screen.getByText('stats')).toBeInTheDocument()
})

test('the picture is ringed in the given colour; with none, the fallback, and no glow', () => {
  const { container, rerender } = render(<MainPageProfileCard avatarSrc="a.png" avatarFallback={<span>mark</span>} ring="#66c0f4" name="P" stats={null} />)
  // The glow behind and the picture itself.
  expect(container.querySelectorAll('img')).toHaveLength(2)
  expect((container.querySelectorAll('img')[1].parentElement as HTMLElement).style.boxShadow).toContain('#66c0f4')
  rerender(<MainPageProfileCard avatarSrc={null} avatarFallback={<span>mark</span>} ring="#66c0f4" name="P" stats={null} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByText('mark')).toBeInTheDocument()
})
