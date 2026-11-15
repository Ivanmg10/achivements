import { renderHook } from '@testing-library/react'
import { useEntrancesOnce } from './useEntrancesOnce'

class FakeCssAnimation {}

beforeAll(() => {
  ;(globalThis as unknown as { CSSAnimation: unknown }).CSSAnimation = FakeCssAnimation
})

function list(className: string, rows: number) {
  const el = document.createElement('ul')
  el.className = className
  for (let i = 0; i < rows; i++) {
    const row = document.createElement('li')
    row.getAnimations = () => []
    el.append(row)
  }
  document.body.append(el)
  return el
}
const end = (row: Element) => row.dispatchEvent(new Event('animationend', { bubbles: true }))
const play = (row: Element) => {
  row.getAnimations = () => [new FakeCssAnimation() as unknown as Animation]
}

afterEach(() => {
  document.body.replaceChildren()
})

test('a list is marked when its last playing row ends', () => {
  renderHook(() => useEntrancesOnce())
  const ul = list('enter-rows', 3)
  const [first, second, third] = ul.children
  play(second)
  play(third)
  end(first)
  expect(ul.hasAttribute('data-entered')).toBe(false)
  second.getAnimations = () => []
  end(second)
  expect(ul.hasAttribute('data-entered')).toBe(false)
  third.getAnimations = () => []
  end(third)
  expect(ul.hasAttribute('data-entered')).toBe(true)
})

test('only the first 12 rows count: nothing past them plays', () => {
  renderHook(() => useEntrancesOnce())
  const ul = list('enter-cards', 14)
  play(ul.children[13])
  end(ul.children[0])
  expect(ul.hasAttribute('data-entered')).toBe(true)
})

test('a hover transition on a row does not hold the list back', () => {
  renderHook(() => useEntrancesOnce())
  const ul = list('enter-rows', 2)
  ul.children[1].getAnimations = () => [{} as Animation]
  end(ul.children[0])
  expect(ul.hasAttribute('data-entered')).toBe(true)
})

test('an animation elsewhere marks nothing', () => {
  renderHook(() => useEntrancesOnce())
  const other = list('grid', 1)
  const nested = list('enter-rows', 1)
  const inner = document.createElement('span')
  nested.children[0].append(inner)
  end(other.children[0])
  end(inner)
  expect(other.hasAttribute('data-entered')).toBe(false)
  expect(nested.hasAttribute('data-entered')).toBe(false)
})

test('stops listening when unmounted', () => {
  const { unmount } = renderHook(() => useEntrancesOnce())
  unmount()
  const ul = list('enter-rows', 1)
  end(ul.children[0])
  expect(ul.hasAttribute('data-entered')).toBe(false)
})
