import { THEMES, THEME_STORAGE_KEY, type Theme } from '@/types/types'

/** The ground inside the C and the accent, as in globals.css (`themes.test.ts` holds them to it). */
const THEME_ICON: Record<Theme, [ground: string, accent: string]> = {
  dark: ['#0a0a0e', '#a78bfa'],
  'dark-red': ['#0a0a0e', '#f87171'],
  'dark-green': ['#0a0a0e', '#4ade80'],
  'dark-blue': ['#0a0a0e', '#7b96ff'],
  'dark-white': ['#0a0a0e', '#f0f1f5'],
  light: ['#eceef2', '#7c3aed'],
  'light-red': ['#eceef2', '#b91c1c'],
  'light-green': ['#eceef2', '#166534'],
  'light-blue': ['#eceef2', '#1d4ed8'],
  'light-black': ['#eceef2', '#17181e'],
  purple: ['#0e0916', '#966efa'],
  red: ['#14080a', '#ec5466'],
  green: ['#090c07', '#84b850'],
  blue: ['#080c14', '#607dff'],
  midnight: ['#0a0e24', '#e2c063'],
  sakura: ['#fdf4f8', '#be185d'],
  arctic: ['#f0f6fa', '#0f766e'],
  'black-ops-2': ['#050607', '#ff6600'],
  'steam-retro': ['#292d23', '#c4b550'],
  'snake-eater': ['#0a130c', '#c9b458'],
  venom: ['#060506', '#ece8f2'],
}

// The logo as drawn. Its shape is not to be changed: only the colours go in `$0`–`$3`.
// `$0` fills inside the C alone, so the C stays open and the logo holds on any tab colour.
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="440 80 1060 1200">' +
  '<path fill="$0" d="M963 200 L1376 452 L1374 893 L970 1150 L560 897 L560 456 Z"/>' +
  '<path fill="$1" d="M963 90 L1482 384 L1376 452 L963 227 L581 456 L581 897 L970 1123 L1374 893 L1490 960 L975 1265 L456 965 L452 385 Z"/>' +
  '<path fill="$1" d="M963 322 L1172 447 L970 930 L760 452 Z"/>' +
  '<path fill="$2" d="M655 495 L880 965 L662 858 Z"/>' +
  '<path fill="$3" d="M1265 495 L1282 855 L1055 975 Z"/>' +
  '</svg>'

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const toHex = (values: number[]) => `#${values.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const isLightGround = (hex: string) => channels(hex).reduce((a, b) => a + b, 0) > 382

/** The V's facets step away from the ground, so all three stay on it in any theme. */
function iconColors(theme: Theme) {
  const [ground, accent] = THEME_ICON[theme]
  const rgb = channels(accent)
  const [toWhite, toBlack] = [(k: number) => toHex(rgb.map((v) => v + (255 - v) * k)), (k: number) => toHex(rgb.map((v) => v * (1 - k)))]
  return isLightGround(ground) ? [ground, accent, toWhite(0.22), toWhite(0.42)] : [ground, accent, toBlack(0.2), toBlack(0.38)]
}

const fill = (colors: string[]) => LOGO.replace(/\$(\d)/g, (_, i: string) => colors[Number(i)])

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
