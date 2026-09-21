import { render, screen } from '@testing-library/react'
import CollapsibleSectionPreview from './CollapsibleSectionPreview'
import type { PreviewGame } from '@/utils/sectionPreview'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const RA: PreviewGame = { key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: 'SNES', imageRef: '/Images/1.png', pct: 50 }
const STEAM: PreviewGame = { key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', imageRef: '', pct: 100 }

test('links each game to its own page, by platform', () => {
  render(<CollapsibleSectionPreview games={[RA, STEAM]} />)
  expect(screen.getByRole('link', { name: /Zelda/ }).getAttribute('href')).toBe('/gameInfo/1')
  expect(screen.getByRole('link', { name: /Portal 2/ }).getAttribute('href')).toBe('/steamGame/620')
})

test('shows progress in text as well as a bar', () => {
  render(<CollapsibleSectionPreview games={[RA]} />)
  expect(screen.getByRole('progressbar', { name: 'Zelda' }).getAttribute('aria-valuenow')).toBe('50')
  expect(screen.getByText('50%')).toBeInTheDocument()
})

test('no bar when there is no progress to show', () => {
  render(<CollapsibleSectionPreview games={[{ ...RA, pct: null }]} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('placeholders while loading, nothing when empty', () => {
  const { container, rerender } = render(<CollapsibleSectionPreview games={[]} loading />)
  expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  rerender(<CollapsibleSectionPreview games={[]} />)
  expect(container.innerHTML).toBe('')
})
