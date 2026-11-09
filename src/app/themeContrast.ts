/** Colour maths for the theme tests: a colour is an `'r g b'` triplet, as the tokens in globals.css write it. */

const channels = (rgb: string) => rgb.split(' ').map(Number)
const triplet = (c: number[]) => c.map((v) => Math.round(Math.min(255, Math.max(0, v)))).join(' ')

const toLinear = (v: number) => {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * Math.max(v, 0) : 1.055 * v ** (1 / 2.4) - 0.055)

export function luminance(rgb: string) {
  const [r, g, b] = channels(rgb).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two colours. */
export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** `fg` laid over `bg` at `alpha`: what a `bg-x/15` tint ends up as. */
export function tint(fg: string, alpha: number, bg: string) {
  const back = channels(bg)
  return triplet(channels(fg).map((v, i) => v * alpha + back[i] * (1 - alpha)))
}

const OKLAB_IN = [[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]]
const OKLAB_LMS = [[0.2104542553, 0.793617785, -0.0040720468], [1.9779984951, -2.428592205, 0.4505937099], [0.0259040371, 0.7827717662, -0.808675766]]
const OKLAB_OUT = [[0.3963377774, 0.2158037573], [-0.1055613458, -0.0638541728], [-0.0894841775, -1.291485548]]
const OKLAB_BACK = [[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.707614701]]
const dot = (row: number[], v: number[]) => row.reduce((sum, k, i) => sum + k * v[i], 0)

const toOklab = (rgb: string) => {
  const lms = OKLAB_IN.map((row) => Math.cbrt(dot(row, channels(rgb).map(toLinear))))
  return OKLAB_LMS.map((row) => dot(row, lms))
}
const fromOklab = ([L, a, b]: number[]) => {
  const lms = OKLAB_OUT.map(([ka, kb]) => (L + ka * a + kb * b) ** 3)
  return triplet(OKLAB_BACK.map((row) => fromLinear(dot(row, lms))))
}

/** `color-mix(in oklab, rgb(hue) share%, rgb(other))`, which is how `streakInk` blends a tier's hue into the text colour. */
export function mixOklab(hue: string, share: number, other: string) {
  const [a, b] = [toOklab(hue), toOklab(other)]
  return fromOklab(a.map((v, i) => v * share + b[i] * (1 - share)))
}
