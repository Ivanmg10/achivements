import { render, screen } from '@testing-library/react'
import RarityBadge, { rarityTone } from './RarityBadge'

it('shows the share as a tinted figure', () => {
  render(<RarityBadge pct={3.21} />)
  expect(screen.getByText('3.2 %').className).toContain('text-hardcore')
})

it('a dash when it is not known', () => {
  render(<RarityBadge pct={null} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})

it('tones by how rare', () => {
  expect(rarityTone(2)).toContain('hardcore')
  expect(rarityTone(12)).toContain('accent')
  expect(rarityTone(60)).toContain('text-secondary')
})
