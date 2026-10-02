/**
 * Uploaded avatars: what is accepted, and the URLs they are served at.
 *
 * Only raster images, recognised by their own first bytes: whatever name or
 * type the browser claims, a file is stored and served as what it is. SVG is
 * left out on purpose, since it can carry script.
 */

export const AVATAR_MAX_BYTES = 512 * 1024

export type AvatarMime = 'image/png' | 'image/jpeg' | 'image/webp'

/** The image type the bytes say, or null for anything else. */
export function sniffImageType(bytes: Uint8Array): AvatarMime | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b)
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  // "RIFF" ···· "WEBP"
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp'
  return null
}

/**
 * Where a user's uploaded avatar is served. The version (upload time) is part
 * of the path, so a new upload is a new URL and the old one can be cached for
 * good. No query string: Next's image component refuses local ones by default.
 */
export function avatarUrl(userId: number | string, version: number): string {
  return `/api/avatar/${userId}-${version}`
}

/** The user id in an avatar path segment ("12-1700000000"), or null if it is not one. */
export function parseAvatarSegment(segment: string): number | null {
  const match = /^(\d+)-\d+$/.exec(segment)
  return match ? Number(match[1]) : null
}

/** Whether a stored avatar value points at an uploaded image rather than a pasted link. */
export function isUploadedAvatar(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith('/api/avatar/'))
}
