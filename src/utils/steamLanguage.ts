import type { Lang } from '@/context/LanguageContext'

/**
 * The app's languages as Steam's API names them. Steam localises achievement
 * names and descriptions and store details, so Steam games can follow the UI
 * language — RA only has English.
 */
export const STEAM_LANGUAGES: Record<Lang, string> = {
  en: 'english',
  es: 'spanish',
  pt: 'portuguese',
  fr: 'french',
  de: 'german',
  it: 'italian',
  ru: 'russian',
  pl: 'polish',
  ja: 'japanese',
}

const SUPPORTED = new Set(Object.values(STEAM_LANGUAGES))

export function toSteamLanguage(lang: string | null | undefined): string {
  return STEAM_LANGUAGES[lang as Lang] ?? 'english'
}

/** Validates a Steam language taken from a request, falling back to English. */
export function parseSteamLanguage(value: string | null | undefined): string {
  return value && SUPPORTED.has(value) ? value : 'english'
}
