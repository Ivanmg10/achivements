import { cookies, headers } from 'next/headers'
import { LANGUAGE_COOKIE, isLang, parseAcceptLanguage, pickLanguage, type Lang } from '@/utils/languages'

/**
 * The language to render a page in on the server, the same way the browser
 * will pick it: the person's choice (its cookie), else the first language
 * their browser asks for that the app has, else null (English). Reading the
 * request makes a page dynamic, so it is called only by layouts that already
 * are (`(main)`, which reads the session); static pages keep painting English
 * until they hydrate.
 */
export async function serverLanguage(): Promise<Lang | null> {
  const chosen = (await cookies()).get(LANGUAGE_COOKIE)?.value
  if (isLang(chosen)) return chosen
  return pickLanguage(parseAcceptLanguage((await headers()).get('accept-language')))
}
