jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))

import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useVaultMe } from '@/hooks/useVaultMe'
import { en } from '@/translations/en'
import { levelOf } from '@/utils/vaultLevel'
import LayoutModalPreviewSampleProfile from './LayoutModalPreviewSampleProfile'

const signedIn = (user: Record<string, unknown> = { name: 'Ana', avatar: null }) =>
  (useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })

test("shows the person's own name, picture and level, never a made-up one (#132)", () => {
  signedIn({ name: 'Ana', avatar: 'https://example.com/ana.png' })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 5000 }, isLoading: false })
  const { container } = render(<LayoutModalPreviewSampleProfile />)
  expect(screen.getByText('Ana')).toBeInTheDocument()
  expect(container.querySelector('img[src*="ana.png"]')).not.toBeNull()
  expect(screen.getByTitle(new RegExp(`${en.rankings.level.replace('{n}', String(levelOf(5000)))}`))).toBeInTheDocument()
  expect(screen.getByText('5,000')).toBeInTheDocument()
  expect(screen.queryByText('CheevoVault')).not.toBeInTheDocument()
})

test('the level bar is the real progress to the next level', () => {
  signedIn()
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 5000 }, isLoading: false })
  render(<LayoutModalPreviewSampleProfile />)
  const bar = screen.getByRole('progressbar')
  expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
  expect(bar).toHaveAccessibleName(bar.nextElementSibling!.textContent!)
})

test('while the points are on their way the level is a skeleton, not a wrong "level 1"', () => {
  signedIn()
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: null, isLoading: true })
  const { container } = render(<LayoutModalPreviewSampleProfile />)
  expect(screen.queryByTitle(/Level/)).not.toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).not.toBeNull()
})

test('with no session to read it still draws a card, under the site\'s name', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: null, isLoading: false })
  render(<LayoutModalPreviewSampleProfile />)
  expect(screen.getByText('CheevoVault')).toBeInTheDocument()
})
