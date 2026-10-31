import { en, type Translations } from '@/translations/en'
import type { Lang } from '@/utils/languages'

const LOADERS: Record<Exclude<Lang, 'en'>, () => Promise<Translations>> = {
  es: () => import('@/translations/es').then((m) => m.es),
  pt: () => import('@/translations/pt').then((m) => m.pt),
  fr: () => import('@/translations/fr').then((m) => m.fr),
  de: () => import('@/translations/de').then((m) => m.de),
  it: () => import('@/translations/it').then((m) => m.it),
  ru: () => import('@/translations/ru').then((m) => m.ru),
  pl: () => import('@/translations/pl').then((m) => m.pl),
  ja: () => import('@/translations/ja').then((m) => m.ja),
}

/** A language's texts, in a chunk of their own: every page used to download all nine. */
export function loadMessages(lang: Lang): Promise<Translations> {
  return lang === 'en' ? Promise.resolve(en) : LOADERS[lang]()
}
