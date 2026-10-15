import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserFollowButton from './PublicUserFollowButton'
import { useFollow } from '@/hooks/useFollow'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFollow', () => ({ useFollow: jest.fn() }))

const toggle = jest.fn()

test('says whether you follow them, in words and pressed state, and toggles', () => {
  ;(useFollow as jest.Mock).mockReturnValue({ following: false, pending: false, toggle })
  const { rerender } = render(<PublicUserFollowButton username="ivan" initial={false} />)
  const button = screen.getByRole('button', { name: en.following.follow })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(button)
  expect(toggle).toHaveBeenCalled()
  expect(useFollow).toHaveBeenCalledWith('ivan', false)

  ;(useFollow as jest.Mock).mockReturnValue({ following: true, pending: true, toggle })
  rerender(<PublicUserFollowButton username="ivan" initial />)
  expect(screen.getByRole('button', { name: en.following.following })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button')).toBeDisabled()
})
