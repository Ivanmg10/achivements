import { act, fireEvent, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'
import { useLibraryKeys } from './useLibraryKeys'

describe('useMediaQuery', () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia
  })

  test('follows the query as the window changes', () => {
    let listener: () => void = () => {}
    let matches = false
    window.matchMedia = jest.fn(() => ({
      get matches() { return matches },
      addEventListener: (_: string, l: () => void) => { listener = l },
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
    matches = true
    act(() => listener())
    expect(result.current).toBe(true)
  })

  test('is false where the browser cannot tell', () => {
    expect(renderHook(() => useMediaQuery('(min-width: 1px)')).result.current).toBe(false)
  })
})

describe('useLibraryKeys', () => {
  const setup = (over: { hasQuery?: boolean } = {}) => {
    const m = { onClearQuery: jest.fn(), onMove: jest.fn() }
    const { unmount } = renderHook(() => useLibraryKeys({ hasQuery: false, searchId: 'search', ...m, ...over }))
    return { ...m, unmount }
  }
  const press = (key: string) => fireEvent.keyDown(document, { key })

  test('the arrows move through the list', () => {
    const k = setup()
    press('ArrowDown'); press('ArrowUp')
    expect(k.onMove.mock.calls).toEqual([[1], [-1]])
  })

  test('Escape clears the search first', () => {
    const k = setup({ hasQuery: true })
    press('Escape')
    expect(k.onClearQuery).toHaveBeenCalled()
  })

  test('with no search, Escape does nothing (there is no other view to go back to)', () => {
    const k = setup()
    press('Escape')
    expect(k.onClearQuery).not.toHaveBeenCalled()
  })

  test('"/" goes to the search, and the arrows are left alone while typing in it', () => {
    const input = document.createElement('input')
    input.id = 'search'
    document.body.appendChild(input)
    const k = setup()
    press('/')
    expect(document.activeElement).toBe(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(k.onMove).not.toHaveBeenCalled()
    input.remove()
  })
})
