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
