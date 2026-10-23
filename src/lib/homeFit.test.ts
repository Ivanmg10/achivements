import { homeFit, MAX_TRIM } from './homeFit'

function box(height: number, top = 64) {
  const el = document.createElement('main')
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height })
  el.getBoundingClientRect = () => ({ top } as DOMRect)
  return el
}

beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 }) // run at once: no frame left pending
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
})
afterEach(() => jest.restoreAllMocks())

test('what runs past the screen comes off the chart', () => {
  const el = box(960)
  homeFit(el)
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('24px')
})

test('nothing when it fits', () => {
  const el = box(900)
  homeFit(el)
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('0px')
})

test('never more than the chart can give', () => {
  const el = box(1400)
  homeFit(el)
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe(`${MAX_TRIM}px`)
})

test('measured again when the window changes, and not after it is gone', () => {
  const el = box(960)
  const cleanup = homeFit(el)
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1010 })
  window.dispatchEvent(new Event('resize'))
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('14px')
  cleanup?.()
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1100 })
  window.dispatchEvent(new Event('resize'))
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('14px')
})
