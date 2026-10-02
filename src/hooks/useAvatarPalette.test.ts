import { renderHook, waitFor } from '@testing-library/react'
import { useAvatarPalette } from './useAvatarPalette'

let loads = true
const setSrc = jest.fn()

beforeAll(() => {
  Object.defineProperty(global.Image.prototype, 'src', {
    set(value: string) {
      setSrc(value)
      setTimeout(() => (loads ? this.onload() : this.onerror()))
    },
  })
  // Two flat halves: green and blue.
  const data = new Uint8ClampedArray(32 * 32 * 4).map((_, i) => {
    const px = Math.floor(i / 4)
    const channel = i % 4
    const green = px < 512
    return channel === 3 ? 255 : green ? [30, 160, 60][channel] : [20, 60, 200][channel]
  })
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn(), getImageData: () => ({ data }) })) as never
})

beforeEach(() => {
  loads = true
  setSrc.mockClear()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('reads the two main colours of an uploaded avatar', async () => {
  const { result } = renderHook(() => useAvatarPalette('/api/avatar/7-1'))
  await waitFor(() => expect(result.current).not.toBeNull())
  expect(result.current).toHaveLength(2)
  expect(result.current).toEqual(expect.arrayContaining([[30, 160, 60], [20, 60, 200]]))
})

test('leaves pasted links alone: another host usually cannot be read', () => {
  const { result } = renderHook(() => useAvatarPalette('https://i.pinimg.com/a.jpg'))
  expect(result.current).toBeNull()
  expect(setSrc).not.toHaveBeenCalled()
})

test('no avatar, no colours', () => {
  const { result } = renderHook(() => useAvatarPalette(null))
  expect(result.current).toBeNull()
})

test('a picture that fails to load gives no colours, and says why in the console', async () => {
  loads = false
  const { result } = renderHook(() => useAvatarPalette('/api/avatar/7-2'))
  await waitFor(() => expect(console.error).toHaveBeenCalled())
  expect(result.current).toBeNull()
})
