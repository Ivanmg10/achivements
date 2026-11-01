import { THEMES, THEME_STORAGE_KEY, type Theme } from '@/types/types'

/** Each theme's accent, as in globals.css (`themes.test.ts` holds them to it). */
const THEME_ACCENT: Record<Theme, string> = {
  dark: '#a78bfa',
  'dark-red': '#f87171',
  'dark-green': '#4ade80',
  'dark-blue': '#7b96ff',
  'dark-white': '#f0f1f5',
  light: '#7c3aed',
  'light-red': '#b91c1c',
  'light-green': '#166534',
  'light-blue': '#1d4ed8',
  'light-black': '#17181e',
  purple: '#966efa',
  red: '#ec5466',
  green: '#84b850',
  blue: '#607dff',
  midnight: '#e2c063',
  crimson: '#e2c063',
  sakura: '#be185d',
  arctic: '#0f766e',
  'black-ops-2': '#ff6600',
  'steam-retro': '#c4b550',
  'snake-eater': '#c9b458',
  venom: '#ef5a5f',
}

// The logo as drawn. Its shape is not to be changed: only the colours go in `$0`–`$5`.
// No ground behind it: a page cannot read the colour of a tab, so any ground clashes with
// some browser's theme. `prefers-color-scheme` gives the tone, as in the logo's first file.
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="440 80 1060 1200">' +
  '<style>.a{fill:$0}.b{fill:$1}.c{fill:$2}@media (prefers-color-scheme:light){.a{fill:$3}.b{fill:$4}.c{fill:$5}}</style>' +
  '<path class="a" d="M963 90 L1482 384 L1376 452 L963 227 L581 456 L581 897 L970 1123 L1374 893 L1490 960 L975 1265 L456 965 L452 385 Z"/>' +
  '<path class="a" d="M963 322 L1172 447 L970 930 L760 452 Z"/>' +
  '<path class="b" d="M655 495 L880 965 L662 858 Z"/>' +
  '<path class="c" d="M1265 495 L1282 855 L1055 975 Z"/>' +
  '</svg>'

const BROWSER = { dark: { tab: '#35363a', ink: '#e1e4eb', towards: 255 }, light: { tab: '#ffffff', ink: '#17181e', towards: 0 } }
const MIN_CONTRAST = 4

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const mix = (hex: string, towards: number, k: number) =>
  `#${channels(hex).map((v) => Math.round(v + (towards - v) * k).toString(16).padStart(2, '0')).join('')}`

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function iconContrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** The accent, moved just enough to read on that browser. White and black have no hue to keep: they take the browser's ink. */
function tone(accent: string, scheme: keyof typeof BROWSER) {
  const { tab, ink, towards } = BROWSER[scheme]
  const rgb = channels(accent)
  if (Math.max(...rgb) - Math.min(...rgb) < 24) return ink
  let k = 0
  while (iconContrast(mix(accent, towards, k), tab) < MIN_CONTRAST && k < 1) k += 0.02
  return mix(accent, towards, k)
}

/** The tones for a dark browser, then for a light one; the V's facets step towards the tab, as the logo's light falls. */
function iconColors(theme: Theme) {
  const [dark, light] = [tone(THEME_ACCENT[theme], 'dark'), tone(THEME_ACCENT[theme], 'light')]
  return [dark, mix(dark, 0, 0.2), mix(dark, 0, 0.38), light, mix(light, 255, 0.22), mix(light, 255, 0.42)]
}

const fill = (colors: string[]) => LOGO.replace(/\$(\d)/g, (_, i: string) => colors[Number(i)])

export const themeAccent = (theme: Theme) => THEME_ACCENT[theme]
export const themeIconTones = (theme: Theme) => ({ dark: iconColors(theme)[0], light: iconColors(theme)[3] })
export const themeIconSvg = (theme: Theme) => fill(iconColors(theme))
export const themeIconHref = (theme: Theme) => `data:image/svg+xml,${encodeURIComponent(themeIconSvg(theme))}`

/** The `<link>` in the root layout. A data URL has no address for the browser to cache, so a new one always shows. */
export function setThemeIcon(theme: Theme) {
  document.getElementById('theme-icon')?.setAttribute('href', themeIconHref(theme))
}

/**
 * Paints the last theme this browser used, and its favicon, before the first
 * frame; without it every load flashes dark until the session says otherwise.
 * Anything that is not a theme today (one since removed) leaves the default.
 */
export function themeScript() {
  const colors = Object.fromEntries(THEMES.map((t) => [t, iconColors(t)]))
  return `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}),c=${JSON.stringify(colors)};if(Object.prototype.hasOwnProperty.call(c,t)){document.documentElement.dataset.theme=t;document.getElementById('theme-icon').href='data:image/svg+xml,'+encodeURIComponent(${JSON.stringify(LOGO)}.replace(/\\$(\\d)/g,function(m,i){return c[t][i]}))}}catch(e){}`
}
