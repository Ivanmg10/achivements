import { fireEvent, render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useStreakData } from '@/hooks/useStreakData'
import { useVaultFillState } from '@/context/VaultFillContext'
import MainPageProfileFold from './MainPageProfileFold'
import MainPageProfileFoldSkeleton from './main-page-profile-fold-skeleton/MainPageProfileFoldSkeleton'

jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))
jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('@/context/VaultFillContext', () => ({ useVaultFillState: jest.fn() }))

function given({ points = 126_000, levelLoading = false, streak = 12 as number | null, filling = false } = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'PalmeraMiami', avatar: null } } })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: levelLoading ? null : { points }, isLoading: levelLoading })
  ;(useStreakData as jest.Mock).mockReturnValue({ activeStreak: streak ? { days: streak } : null, isLoading: streak === null })
  ;(useVaultFillState as jest.Mock).mockReturnValue(filling ? { active: true, pct: 40 } : null)
}

test('one line: the name, the level, the streak and "See profile", which says it opens the column', () => {
  given()
  const onToggle = jest.fn()
  render(<MainPageProfileFold open={false} onToggle={onToggle} controls="side" />)
  expect(screen.getByText('PalmeraMiami')).toBeInTheDocument()
  expect(screen.getByLabelText(`${en.streak.title}: 12 days`)).toBeInTheDocument()
  expect(screen.getByTitle(/Level/)).toBeInTheDocument()
  const button = screen.getByRole('button', { name: en.mainPage.showProfile })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(button).toHaveAttribute('aria-controls', 'side')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalled()
})

test('opened, the button folds it again', () => {
  given()
  render(<MainPageProfileFold open onToggle={() => {}} controls="side" />)
  expect(screen.getByRole('button', { name: en.mainPage.hideProfile })).toHaveAttribute('aria-expanded', 'true')
})

test('only on a phone: from sm the line is not drawn', () => {
  given()
  const { container } = render(<MainPageProfileFold open={false} onToggle={() => {}} controls="side" />)
  expect(container.firstElementChild).toHaveClass('sm:hidden')
})

test('the streak is drawn only whole and the level only once the points are known: their room meanwhile, no 0', () => {
  given({ streak: null, levelLoading: true })
  render(<MainPageProfileFold open={false} onToggle={() => {}} controls="side" />)
  expect(screen.queryByText('0 d')).toBeNull()
  expect(screen.queryByTitle(/Level/)).toBeNull()
  expect(screen.queryByLabelText(new RegExp(en.streak.title))).toBeNull()
})

test('while the points are calculated the level keeps its room, with no number', () => {
  given({ filling: true })
  render(<MainPageProfileFold open={false} onToggle={() => {}} controls="side" />)
  expect(screen.queryByTitle(/Level/)).toBeNull()
})

test('its skeleton is the same box, phone only, hidden from a screen reader', () => {
  const { container } = render(<MainPageProfileFoldSkeleton />)
  expect(container.firstElementChild).toHaveClass('sm:hidden')
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})
