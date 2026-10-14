import { act, fireEvent, renderHook } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useNavigationProgress } from './useNavigationProgress'

const mockPathname = usePathname as jest.Mock

function addLink(href: string, attrs: Record<string, string> = {}) {
  const a = document.createElement('a')
  a.href = href
  Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v))
  // jsdom cannot navigate; the hook listens first (capture), so this changes nothing for it.
  a.addEventListener('click', (e) => e.preventDefault())
  document.body.appendChild(a)
  return a
}

beforeEach(() => {
  jest.useFakeTimers()
  mockPathname.mockReturnValue('/')
})
afterEach(() => {
  jest.useRealTimers()
  document.body.innerHTML = ''
})

test('is on from the click on a link to another page', () => {
  const { result } = renderHook(() => useNavigationProgress())
  expect(result.current).toBe(false)

  fireEvent.click(addLink('/groups'))
  expect(result.current).toBe(true)
})

test('ends when the page arrives', () => {
  const { result, rerender } = renderHook(() => useNavigationProgress())
  fireEvent.click(addLink('/groups'))

  mockPathname.mockReturnValue('/groups')
  rerender()
  expect(result.current).toBe(false)
})

test('gives up if the page never arrives', () => {
  const { result } = renderHook(() => useNavigationProgress())
  fireEvent.click(addLink('/groups'))

  act(() => { jest.advanceTimersByTime(15_000) })
  expect(result.current).toBe(false)
})

test.each([
  ['another site', () => addLink('https://example.com/groups'), {}],
  ['the page it is already on', () => addLink('/'), {}],
  ['a new tab', () => addLink('/groups', { target: '_blank' }), {}],
  ['a download', () => addLink('/groups', { download: '' }), {}],
  ['a click with ctrl', () => addLink('/groups'), { ctrlKey: true }],
  ['a click with the middle button', () => addLink('/groups'), { button: 1 }],
])('stays off for %s', (_name, make, init) => {
  const { result } = renderHook(() => useNavigationProgress())

  fireEvent.click(make(), init)
  expect(result.current).toBe(false)
})

test('ignores clicks that are not on a link', () => {
  const { result } = renderHook(() => useNavigationProgress())

  fireEvent.click(document.body)
  expect(result.current).toBe(false)
})

test('a click on something inside a link counts', () => {
  const { result } = renderHook(() => useNavigationProgress())
  const link = addLink('/groups')
  const inner = document.createElement('span')
  link.appendChild(inner)

  fireEvent.click(inner)
  expect(result.current).toBe(true)
})
