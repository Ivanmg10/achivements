import { fireEvent, render } from '@testing-library/react'
import UserProfileBanner from './UserProfileBanner'
import { useAvatarPalette } from '@/hooks/useAvatarPalette'

jest.mock('@/hooks/useAvatarPalette', () => ({ useAvatarPalette: jest.fn(() => null) }))

test('is the avatar, blurred, and hidden from assistive tech', () => {
  const { container } = render(<UserProfileBanner avatar="https://example.com/me.jpg" />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/me.jpg')
})

test('without an avatar it is only the accent wash', () => {
  const { container } = render(<UserProfileBanner avatar={null} />)
  expect(container.querySelector('img')).not.toBeInTheDocument()
  expect(container.firstElementChild).toBeInTheDocument()
})

test('drops the picture if it fails to load', () => {
  const { container } = render(<UserProfileBanner avatar="https://example.com/broken.jpg" />)
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).not.toBeInTheDocument()
})

describe('with an uploaded avatar', () => {
  test('blends its two colours instead of blurring the picture', () => {
    ;(useAvatarPalette as jest.Mock).mockReturnValueOnce([[30, 160, 60], [20, 60, 200]])
    const { container, getByTestId } = render(<UserProfileBanner avatar="/api/avatar/7-1" />)
    const wash = getByTestId('avatar-palette')
    expect(wash.style.getPropertyValue('--c1')).toBe('rgb(30 160 60)')
    expect(wash.style.getPropertyValue('--c2')).toBe('rgb(20 60 200)')
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
