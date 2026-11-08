import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import VaultLevelBadge from './VaultLevelBadge'
import VaultPlatformSplit from '@/components/vault-platform-split/VaultPlatformSplit'

test('shows the level and the tier in words', () => {
  render(<VaultLevelBadge points={126_000} />)
  expect(screen.getByText('Lv 32')).toBeInTheDocument()
  expect(screen.getByText('Lv 32').parentElement).toHaveClass('-skew-x-(--slant-pill)')
  expect(screen.getByTitle(`Level 32 · ${en.rankings.tiers.veteran}`)).toHaveClass('skew-x-(--slant-pill)')
  expect(screen.getByText(`· ${en.rankings.tiers.veteran}`)).toBeInTheDocument()
})

test('compact keeps the tier for screen readers and the tooltip', () => {
  render(<VaultLevelBadge points={0} compact />)
  expect(screen.getByText(en.rankings.tiers.novice)).toHaveClass('sr-only')
  expect(screen.getByTitle(`Level 1 · ${en.rankings.tiers.novice}`)).toBeInTheDocument()
})

test('compact="phone" is one badge that drops the tier below sm, never two badges (V3-08)', () => {
  const { container } = render(<VaultLevelBadge points={126_000} compact="phone" />)
  expect(container.querySelectorAll('[title]')).toHaveLength(1)
  const tier = screen.getByText(`· ${en.rankings.tiers.veteran}`)
  expect(tier).toHaveClass('max-sm:sr-only')
})

test('the platform split says each share in words', () => {
  render(<VaultPlatformSplit split={{ ra: 300, psn: 100, steam: 0 }} />)
  expect(screen.getByRole('img', { name: 'RA 75 %, PSN 25 %' })).toBeInTheDocument()
})
