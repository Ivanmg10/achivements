import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import VaultFillProgress from './VaultFillProgress'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
import MainHeaderLevel from '@/components/main-header/main-header-level/MainHeaderLevel'
import { useVaultFillState } from '@/context/VaultFillContext'
import { useVaultMe } from '@/hooks/useVaultMe'

jest.mock('@/context/VaultFillContext', () => ({ useVaultFillState: jest.fn() }))
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn(() => ({ me: { points: 500 } })) }))

const fill = (active: boolean, platforms: object) => ({ active, read: 200, total: 225, pct: 88, version: 1, status: { complete: !active, running: active, points: 0, updatedAt: '', platforms } })

test('while it runs: a bar per platform, a tick when one is done, and that you already rank', () => {
  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(true, { steam: { read: 190, total: 190, state: 'done' }, ra: { read: 10, total: 35, state: 'reading' }, xbox: { read: 1, total: 10, state: 'estimated' } }))
  render(<VaultFillProgress />)
  expect(screen.getAllByRole('progressbar')).toHaveLength(3)
  expect(screen.getByText('10 / 35')).toBeInTheDocument()
  expect(screen.getByText(en.rankings.fillXbox)).toBeInTheDocument()
  expect(screen.getByText(en.rankings.fillInRanking)).toBeInTheDocument()
})

test('after it ends, only a platform that needs you; nothing when all is well', () => {
  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(false, { steam: { read: 0, total: 0, state: 'error', error: 'private' }, ra: { read: 35, total: 35, state: 'done' } }))
  const { rerender } = render(<VaultFillProgress />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.rankings.fillPrivateSteam)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(false, { ra: { read: 35, total: 35, state: 'done' } }))
  rerender(<VaultFillProgress />)
  expect(screen.queryByText(/./)).not.toBeInTheDocument()
})

test("a platform's card: calculating with a bar, then how many counted, or what is wrong", () => {
  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(true, { steam: { read: 152, total: 190, state: 'reading' } }))
  const { rerender } = render(<VaultFillLine source="steam" />)
  expect(screen.getByRole('status')).toHaveTextContent('152 of 190 games')

  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(false, { steam: { read: 188, total: 190, skipped: 2, state: 'done' } }))
  rerender(<VaultFillLine source="steam" />)
  expect(screen.getByText('188 games counted')).toBeInTheDocument()
  expect(screen.getByText(/2 the platform would not answer for/)).toBeInTheDocument()

  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(false, { ra: { read: 0, total: 0, state: 'error', error: 'key' } }))
  rerender(<VaultFillLine source="ra" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.rankings.fillKey)
})

test('the header fills a ring with the percentage while calculating, then shows the level', () => {
  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(true, {}))
  const { rerender } = render(<MainHeaderLevel />)
  expect(screen.getByRole('link')).toHaveTextContent(en.rankings.fillA11y.replace('{pct}', '88'))

  ;(useVaultFillState as jest.Mock).mockReturnValue(fill(false, {}))
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 500 } })
  rerender(<MainHeaderLevel />)
  expect(screen.getByRole('link')).toHaveTextContent('Lv 2')
})
