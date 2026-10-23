/** The languages the app is written in, by their own names (how a speaker looks for theirs). */
export const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'pl', label: 'Polski', flag: '🇵🇱' },
  { id: 'ja', label: '日本語', flag: '🇯🇵' },
] as const

export type Lang = (typeof LANGUAGES)[number]['id']

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && LANGUAGES.some((l) => l.id === value)
}

/**
 * The first of the browser's languages (`navigator.languages`, best first) that
 * the app has, by its root: `es-MX` is Spanish, `pt-BR` Portuguese. `null` when
 * none of them is one we have.
 */
export function pickLanguage(preferred: readonly string[] | null | undefined): Lang | null {
  for (const tag of preferred ?? []) {
    const root = tag.toLowerCase().split('-')[0]
    if (isLang(root)) return root
  }
  return null
}

/** What this browser asks for, or nothing where there is no browser. */
export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : []
}

/**
 * The languages an `Accept-Language` header asks for, best first
 * (`es-MX,es;q=0.9,en;q=0.8` → `['es-MX', 'es', 'en']`), dropping `*` and `q=0`.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  return (header ?? '')
    .split(',')
    .map((part, order) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) : 1, order }
    })
    .filter((l) => l.tag && l.tag !== '*' && l.q > 0 && !Number.isNaN(l.q))
    .sort((a, b) => b.q - a.q || a.order - b.order)
    .map((l) => l.tag)
}

/**
 * The language a person picked, also kept in a cookie so the server can render
 * a page in it from the first byte (the browser's own storage is out of its
 * reach). Only a person's pick is written, never a detected language.
 */
export const LANGUAGE_COOKIE = 'app-language'
const YEAR = 60 * 60 * 24 * 365

export function languageCookie(lang: Lang, secure: boolean): string {
  return `${LANGUAGE_COOKIE}=${lang}; Path=/; Max-Age=${YEAR}; SameSite=Lax${secure ? '; Secure' : ''}`
}
