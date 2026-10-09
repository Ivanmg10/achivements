/**
 * Adds `user=<name>` to a read URL when the data being shown belongs to
 * someone else (a public profile), so the server answers for that user. With no
 * subject the URL is the signed-in user's own, untouched.
 */
export function withSubject(url: string, subject: string | null): string {
  if (!subject) return url
  return `${url}${url.includes('?') ? '&' : '?'}user=${encodeURIComponent(subject)}`
}
