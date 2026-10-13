import type { GameSource } from '@/types/steam'

export type GuideLink = { kind: 'youtube' | 'steamGuides' | 'psnProfiles'; href: string }

/**
 * Where to look for help with one achievement or trophy: a YouTube search
 * for it (works for every game), plus the platform's own guides — Steam
 * Community guides for the game, PSNProfiles' search for it. RA's page
 * already has its comments, so it gets no links here.
 */
export function guideLinks(
  source: Exclude<GameSource, 'ra'>,
  { gameTitle, title, appId }: { gameTitle: string; title: string; appId?: number },
): GuideLink[] {
  const noun = source === 'psn' ? 'trophy' : 'achievement'
  const links: GuideLink[] = [
    {
      kind: 'youtube',
      href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${gameTitle} ${title} ${noun} guide`)}`,
    },
  ]
  if (source === 'steam' && appId !== undefined) {
    links.push({ kind: 'steamGuides', href: `https://steamcommunity.com/app/${appId}/guides/?searchText=${encodeURIComponent(title)}` })
  }
  if (source === 'psn') {
    links.push({ kind: 'psnProfiles', href: `https://psnprofiles.com/search/games?q=${encodeURIComponent(gameTitle)}` })
  }
  return links
}
