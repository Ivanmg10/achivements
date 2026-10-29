import { renderHook } from '@testing-library/react'
import { averageTint, useImageTint, NEUTRAL_TINT } from './useImageTint'

const px = (...rgba: number[][]) => new Uint8ClampedArray(rgba.flat())

describe('averageTint', () => {
  it('keeps a vivid colour within the capped chroma band', () => {
    expect(averageTint(px([200, 40, 40, 255], [200, 40, 40, 255]))).toBe('197 55 50')
  })

  it('ignores transparent, near-black and near-white pixels', () => {
    expect(averageTint(px([0, 0, 0, 0], [10, 10, 10, 255], [250, 250, 250, 255], [40, 120, 200, 255]))).toBe('40 120 200')
  })

  it('uses the most colourful hue cluster instead of the whole image average', () => {
    const red = [200, 40, 40, 255]
    const muted = [130, 125, 120, 255]
    expect(averageTint(px(red, red, muted, muted, muted, muted))).toBe(averageTint(px(red, red)))
  })

  it('is neutral for artwork without a real colour', () => {
    expect(averageTint(px([120, 120, 120, 255], [80, 82, 84, 255]))).toBe(NEUTRAL_TINT)
  })

  it('caps neon colours and lifts dark colours into a readable band', () => {
    expect(averageTint(px([0, 255, 0, 255]))).toBe('100 205 93')
    expect(averageTint(px([60, 20, 20, 255]))).toBe('153 96 93')
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
