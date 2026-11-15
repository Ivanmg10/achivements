/** Where Steam's pictures and pages live. Pure, and safe in the browser: steamClient, which calls Steam, is not. */
const APP_ASSETS = 'https://cdn.akamai.steamstatic.com/steam/apps'
const MEDIA_BASE = 'https://media.steampowered.com/steamcommunity/public/images/apps'

/**
 * The game's square icon. Not the 32×32 `img_icon_url` the game list carries:
 * /api/steam/icon redirects to the desktop icon (up to 256px), or to the
 * cover when the game has none.
 */
export function gameIconUrl(appId: number): string {
  return `/api/steam/icon?appid=${appId}`
}

/** Old icon URLs saved before gameIconUrl changed (favourites), upgraded on read. */
export function upgradeLegacyIconUrl(url: string): string {
  const legacy = url.match(/^https:\/\/media\.steampowered\.com\/steamcommunity\/public\/images\/apps\/(\d+)\/[a-f0-9]+\.jpg$/)
  return legacy ? gameIconUrl(Number(legacy[1])) : url
}

export function gameLogoUrl(appId: number, imgLogoUrl?: string): string {
  return imgLogoUrl ? `${MEDIA_BASE}/${appId}/${imgLogoUrl}.jpg` : ''
}

export type SteamAsset = 'cover' | 'header' | 'hero' | 'logo'

const ASSET_FILES: Record<SteamAsset, string> = {
  cover: 'library_600x900.jpg',
  header: 'header.jpg',
  hero: 'library_hero.jpg',
  logo: 'logo.png',
}

export function steamAssetUrl(appId: number, asset: SteamAsset): string {
  return `${APP_ASSETS}/${appId}/${ASSET_FILES[asset]}`
}

/**
 * PICS app info through steamcmd.net (unofficial; Steam's Web API does not
 * expose it). Only read for `common.clienticon`, so callers must cache.
 */
export function clientIconUrl(appId: number, hash: string): string {
  return `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${hash}.ico`
}

/** The game's page on the Steam store. */
export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`
}
