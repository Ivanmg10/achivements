import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import UserVaultLevel from './UserVaultLevel'
import MainHeaderLevel from '@/components/main-header/main-header-level/MainHeaderLevel'
import { useVaultMe } from '@/hooks/useVaultMe'

jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))

const me = (points: number) => ({ points, split: {}, week: 0, month: 0, rank: points ? 12 : 0, listed: true, showInRankings: true, provisional: 0, refreshedAt: null })

test('your level, points and place, leading to the rankings', () => {
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: me(126_000), isLoading: false })
  render(<UserVaultLevel />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/rankings')
  expect(link).toHaveTextContent('126,000')
  expect(link).toHaveTextContent('#12')
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('holds its room while it is read, so the card does not jump when it lands', () => {
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: null, isLoading: true })
  const { container } = render(<UserVaultLevel />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(container.firstElementChild).toHaveClass('rounded-pane')
})

test('takes no room when the level could not be read', () => {
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: null, isLoading: false })
  const { container } = render(<UserVaultLevel />)
  expect(container).toBeEmptyDOMElement()
})

test('before anything is scored, says it is being worked out', () => {
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: me(0), isLoading: false })
  render(<UserVaultLevel />)
  expect(screen.getByText(en.rankings.noScore)).toBeInTheDocument()
})

test('the header shows your level once there are points, and nothing before', () => {
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: me(0) })
  const { rerender } = render(<MainHeaderLevel />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: me(500) })
  rerender(<MainHeaderLevel />)
  expect(screen.getByRole('link', { name: /Rankings.*Lv 2/ })).toHaveAttribute('href', '/rankings')
})
