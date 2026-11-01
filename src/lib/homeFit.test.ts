import { HOME_PROFILE_KEY, homeFit, MAX_TRIM } from './homeFit'

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

test('measured again when the profile changes, as a trimmed box does not resize then', async () => {
  const el = box(960)
  const side = document.createElement('div')
  side.className = 'home-fit-side'
  el.appendChild(side)
  homeFit(el)
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('24px')
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => 900 })
  side.appendChild(document.createElement('div'))
  await Promise.resolve()
  await Promise.resolve()
  expect(el.style.getPropertyValue('--home-fit-trim')).toBe('0px')
})

function withProfile(busy: boolean) {
  const el = box(900)
  const profile = document.createElement('div')
  profile.setAttribute('data-home-profile', '')
  Object.defineProperty(profile, 'offsetHeight', { configurable: true, get: () => 640 })
  if (busy) profile.innerHTML = '<div aria-busy="true"></div>'
  el.appendChild(profile)
  return el
}

test('remembers how tall the loaded profile ended up, for its skeleton', () => {
  localStorage.clear()
  homeFit(withProfile(false))
  expect(localStorage.getItem(HOME_PROFILE_KEY)).toBe(`${window.innerWidth}:640`)
})

test('never takes a skeleton for the profile', () => {
  localStorage.clear()
  homeFit(withProfile(true))
  expect(localStorage.getItem(HOME_PROFILE_KEY)).toBeNull()
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
