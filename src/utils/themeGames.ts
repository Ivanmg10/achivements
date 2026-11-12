import type { Theme } from '@/types/types'
import { raImageUrl } from '@/utils/raAssets'
import { steamAssetUrl } from '@/lib/steamAssets'

const steam = (appId: number) => steamAssetUrl(appId, 'cover')

/** Two games of the art wall (Super Mario Sunshine, Metroid Prime): what every theme but a tribute shows. */
const WALL: [string, string] = [raImageUrl('/Images/081263.png')!, raImageUrl('/Images/117057.png')!]

/** A tribute shows the games it pays tribute to, as Steam covers (the same CDN as the art wall). */
const TRIBUTES: Partial<Record<Theme, [string, string]>> = {
  'black-ops-2': [steam(202970), steam(42700)], // Call of Duty: Black Ops II, Call of Duty: Black Ops
  'snake-eater': [steam(2131650), steam(2417610)], // Metal Gear Solid 3 (Master Collection), Metal Gear Solid Δ: Snake Eater
  venom: [steam(2651280), steam(1817070)], // Marvel's Spider-Man 2, Marvel's Spider-Man Remastered
  'steam-retro': [steam(70), steam(400)], // Half-Life, Portal
}

/** The two covers a theme's small screen shows (`ui/ThemeScreen`). */
export function themeCovers(theme: Theme): [string, string] {
  return TRIBUTES[theme] ?? WALL
}
