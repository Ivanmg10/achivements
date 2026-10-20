/**
 * Xbox is for administrators only while it is tried out. This is the one place
 * that says so: the server routes (requireXboxSession), the session-based UI
 * (useXboxEnabled) and the link route all ask canUseXbox. To open Xbox to
 * everyone, flip this to false — nothing else has to change.
 */
export const XBOX_ADMIN_ONLY = true

/** Whether a user (by their admin flag, read from the database) may see and use Xbox. */
export function canUseXbox(admin: boolean | null | undefined): boolean {
  return !XBOX_ADMIN_ONLY || admin === true
}

/**
 * Whether a write that names a game source may go ahead. Every source but Xbox
 * always may; Xbox only for who canUseXbox. A non-admin cannot have Xbox games
 * to pin, hide or group, so a request naming one is not from the app.
 */
export function sourceAllowed(source: string | null | undefined, admin: boolean | null | undefined): boolean {
  return source !== 'xbox' || canUseXbox(admin)
}
