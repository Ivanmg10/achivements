import { THEMES } from '@/types/types'
import { setThemeIcon, themeIconHref, themeIconSvg, themeScript } from './themeIcon'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const read = (file: string): string => require('fs').readFileSync(require('path').join(process.cwd(), file), 'utf8')

function runScript() {
  new Function(themeScript())()
}

function freshHead() {
  document.head.innerHTML = '<link id="theme-icon" rel="icon" href="/icon.svg">'
  document.documentElement.dataset.theme = 'dark'
  localStorage.clear()
  return document.getElementById('theme-icon') as HTMLLinkElement
}

test('every theme draws the logo with its shapes untouched', () => {
  const shapes = (svg: string) => svg.match(/ d="[^"]+"/g)
  for (const theme of THEMES) expect(shapes(themeIconSvg(theme))).toEqual(shapes(themeIconSvg('dark')))
  expect(new Set(THEMES.map(themeIconSvg)).size).toBe(THEMES.length)
})

test('the logo keeps the opening of the C: its ground stays inside, short of the outer edge', () => {
  const ground = themeIconSvg('dark').match(/ d="([^"]+)"/)![1]
  expect(ground).toContain('L1376 452 L1374 893')
  expect(ground).not.toContain('1482')
})

test('the file on disk, served without JavaScript, is the default theme', () => {
  expect(read('public/icon.svg').trim()).toBe(themeIconSvg('dark'))
})

test('the script paints the saved theme and its icon before anything else runs', () => {
  const link = freshHead()
  localStorage.setItem('app-theme', 'venom')
  runScript()
  expect(document.documentElement.dataset.theme).toBe('venom')
  expect(link.getAttribute('href')).toBe(themeIconHref('venom'))
})

test.each(['synthwave', 'oled', 'constructor', ''])('the script leaves the default for "%s", and does not store it', (saved) => {
  const link = freshHead()
  localStorage.setItem('app-theme', saved)
  runScript()
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(link.getAttribute('href')).toBe('/icon.svg')
  expect(localStorage.getItem('app-theme')).toBe(saved)
})

test('with storage blocked the page keeps the default', () => {
  const link = freshHead()
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  expect(runScript).not.toThrow()
  expect(link.getAttribute('href')).toBe('/icon.svg')
  spy.mockRestore()
})

test('setThemeIcon does nothing where the link is not on the page', () => {
  document.head.innerHTML = ''
  expect(() => setThemeIcon('dark')).not.toThrow()
})

test('the favicon is the one link the site declares, not Next\'s file convention too', () => {
  expect(read('src/app/layout.tsx')).toContain('id="theme-icon"')
  expect(() => read('src/app/icon.svg')).toThrow()
})
