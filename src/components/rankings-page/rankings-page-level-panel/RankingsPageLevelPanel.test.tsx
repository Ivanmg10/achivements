jest.mock('@/hooks/usePsnUnverified', () => ({ usePsnUnverified: jest.fn() }))
jest.mock('@/context/VaultFillContext', () => ({ useVaultFillState: () => null }))
jest.mock('@/components/vault-fill-progress/VaultFillProgress', () => ({ __esModule: true, default: () => null }))

import { render, screen } from '@testing-library/react'
import RankingsPageLevelPanel from './RankingsPageLevelPanel'
import { usePsnUnverified } from '@/hooks/usePsnUnverified'
import { en } from '@/translations/en'
import type { VaultMe } from '@/app/api/rankings/me/route'

const me = (points: number): VaultMe => ({
  points, split: points ? { ra: points } : {}, week: 0, month: 0, rank: points ? 3 : 0, listed: true, showInRankings: true,
  provisional: 0, refreshedAt: null, weeks: [],
})

test.each([[0], [5000]])('PlayStation not verified, %i points: says so and leads to the account page', (points) => {
  ;(usePsnUnverified as jest.Mock).mockReturnValue(true)
  render(<RankingsPageLevelPanel me={me(points)} />)
  expect(screen.getByText(en.psn.verification.vaultLine)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.psn.verification.vaultAction })).toHaveAttribute('href', '/user')
})

test('nothing about it when PlayStation is verified or not linked', () => {
  ;(usePsnUnverified as jest.Mock).mockReturnValue(false)
  render(<RankingsPageLevelPanel me={me(5000)} />)
  expect(screen.queryByText(en.psn.verification.vaultLine)).not.toBeInTheDocument()
})
