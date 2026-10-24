import { renderHook } from '@testing-library/react'
import { averageTint, useImageTint, NEUTRAL_TINT } from './useImageTint'

const px = (...rgba: number[][]) => new Uint8ClampedArray(rgba.flat())

describe('averageTint', () => {
  it('averages the colourful pixels, a bit livelier', () => {
    expect(averageTint(px([200, 40, 40, 255], [200, 40, 40, 255]))).toBe('220 44 44')
  })

  it('ignores transparent, near-black and near-white pixels', () => {
    expect(averageTint(px([0, 0, 0, 0], [10, 10, 10, 255], [250, 250, 250, 255], [40, 120, 200, 255]))).toBe('44 132 220')
  })

  it('is neutral when nothing is left', () => {
    expect(averageTint(px([5, 5, 5, 255]))).toBe(NEUTRAL_TINT)
  })
})

describe('useImageTint', () => {
  it('is null without an image or while it is read', () => {
    expect(renderHook(() => useImageTint(null)).result.current).toBeNull()
    expect(renderHook(() => useImageTint('https://example.com/x.png')).result.current).toBeNull()
  })
})
