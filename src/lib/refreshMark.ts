/**
 * The "refresh" button's signal to the server: a cookie scoped to /api that
 * lasts a few seconds, so every request the refetch makes carries it without
 * each hook having to know. Read by `wantsFresh` (server only). Browser-safe.
 */
export const REFRESH_COOKIE = 'cv_refresh'
const REFRESH_WINDOW_S = 20

export function markRefresh(): void {
  document.cookie = `${REFRESH_COOKIE}=1; path=/api; max-age=${REFRESH_WINDOW_S}; SameSite=Lax`
}
