jest.mock('@/components/steam/steam-game-image/SteamGameImage', () => ({
  __esModule: true,
  default: ({ appId }: { appId: number }) => <span data-testid="steam">{appId}</span>,
}))

import { render, screen } from '@testing-library/react'
import GameIcon from './GameIcon'

test("Steam draws from its own CDN; RA and PSN from the URL given; none is a grey square", () => {
  const { container, rerender } = render(<GameIcon source="steam" id={620} size={32} />)
  expect(screen.getByTestId('steam')).toHaveTextContent('620')
  rerender(<GameIcon source="psn" id={1} imageUrl="https://p.png" size={32} />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://p.png')
  rerender(<GameIcon source="ra" id={1} size={32} className="w-8" />)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass('w-8')
})
