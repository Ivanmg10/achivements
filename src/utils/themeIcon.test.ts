import { THEMES } from '@/types/types'
import { iconContrast, setThemeIcon, themeIconHref, themeIconSvg, themeIconTones, themeScript } from './themeIcon'

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
  expect(themeIconSvg('dark-red')).not.toBe(themeIconSvg('dark'))
})

test('nothing is drawn behind the logo: it is the four shapes of the logo and no more', () => {
  expect(themeIconSvg('dark').match(/<path /g)).toHaveLength(4)
  expect(themeIconSvg('dark')).not.toContain('<rect')
})

test('a theme with hue keeps it on a light browser; white and black take the browser\'s ink', () => {
  expect(themeIconTones('dark-white')).toEqual({ dark: '#e1e4eb', light: '#17181e' })
  expect(themeIconTones('light-black')).toEqual({ dark: '#e1e4eb', light: '#17181e' })
  expect(themeIconTones('sakura').light).toBe('#be185d')
})

test.each(THEMES)('%s reads on a dark and on a light browser', (theme) => {
  const tones = themeIconTones(theme)
  expect(iconContrast(tones.dark, '#35363a')).toBeGreaterThanOrEqual(4)
  expect(iconContrast(tones.light, '#ffffff')).toBeGreaterThanOrEqual(4)
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
