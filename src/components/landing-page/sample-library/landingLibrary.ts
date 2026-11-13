import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy, TrophyGrade } from '@/types/psn'
import type { Lang } from '@/utils/languages'
import { addDays } from '@/utils/dates'

/**
 * The landing library's examples opened: the three Steam games (Fallout 4, Black Ops II, Inazuma Eleven), read once from
 * Steam's public schema and global percentages, and Assassin's Creed Brotherhood (PS4), read once from PSN's trophy list
 * and rarity (2026-11-13). Earned are the most common N, N being the owner's count (52 of 84, 16 of 35, 52 of 52, 51 of
 * 51), dated so many days before the day the page is shown; Black Ops II's agree with the "Achievement by achievement"
 * example. Loaded only when a game is opened, the names in the reader's language only.
 */

/** [api name, icon file, global rarity, secret, days since earned (null: still to get)]. */
export type SampleSteamAchievement = [string, string, number | null, boolean, number | null]

/** [id, grade, group, secret, PSN rarity, icon file, days since earned (null: still to get)]. */
export type SamplePsnTrophy = [number, TrophyGrade, string, boolean, number | null, string, number | null]

/** [name, text] in game order, by Steam app or PSN trophy set. */
export type SampleNames = Record<string, [string, string][]>

const ICONS = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps'

const NAMES: Record<Lang, () => Promise<SampleNames>> = {
  en: () => import('./names/en').then((m) => m.SAMPLE_NAMES),
  es: () => import('./names/es').then((m) => m.SAMPLE_NAMES),
  pt: () => import('./names/pt').then((m) => m.SAMPLE_NAMES),
  fr: () => import('./names/fr').then((m) => m.SAMPLE_NAMES),
  de: () => import('./names/de').then((m) => m.SAMPLE_NAMES),
  it: () => import('./names/it').then((m) => m.SAMPLE_NAMES),
  ru: () => import('./names/ru').then((m) => m.SAMPLE_NAMES),
  pl: () => import('./names/pl').then((m) => m.SAMPLE_NAMES),
  ja: () => import('./names/ja').then((m) => m.SAMPLE_NAMES),
}

/** A time of day per achievement, so a day's unlocks do not all read 18:00. */
const timeOf = (i: number) => `${String(16 + (i % 7)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`

/** An example game's achievements as the app's own Steam shape, named in `names` and dated from `today` ("YYYY-MM-DD"). */
export function toSteamAchievements(appId: number, raw: SampleSteamAchievement[], names: [string, string][], today: string): SteamAchievementUnified[] {
  return raw.map(([api, icon, pct, hidden, daysAgo], i) => ({
    _source: 'steam',
    id: api,
    apiname: api,
    title: names[i]?.[0] ?? api,
    description: names[i]?.[1] ?? '',
    badgeUrl: `${ICONS}/${appId}/${icon}.jpg`,
    displayOrder: i,
    hidden,
    earned: daysAgo !== null,
    dateEarned: daysAgo === null ? null : `${addDays(today, -daysAgo)} ${timeOf(i)}`,
    globalPct: pct,
    likelyOnline: false,
  }))
}

/** The PSN example's trophies as the app's own shape, named in `names` and dated from `today` ("YYYY-MM-DD"). */
export function toPsnTrophies(raw: SamplePsnTrophy[], icons: string, names: [string, string][], today: string): PsnTrophy[] {
  return raw.map(([id, type, groupId, hidden, rarity, icon, daysAgo], i) => ({
    id,
    name: names[i]?.[0] ?? '',
    detail: names[i]?.[1] ?? '',
    iconUrl: `${icons}${icon}`,
    type,
    groupId,
    hidden,
    earned: daysAgo !== null,
    // PSN's own form, ISO in UTC.
    earnedAt: daysAgo === null ? null : `${addDays(today, -daysAgo)}T${timeOf(i)}Z`,
    rarity,
  }))
}

/** One Steam example's achievements, in `lang`: two small chunks, fetched the first time a game is opened. */
export async function loadSampleAchievements(appId: number, lang: Lang, today: string): Promise<SteamAchievementUnified[]> {
  const [{ SAMPLE_STEAM_ACHIEVEMENTS }, names] = await Promise.all([import('./sampleSteamAchievements'), NAMES[lang]()])
  return toSteamAchievements(appId, SAMPLE_STEAM_ACHIEVEMENTS[appId] ?? [], names[appId] ?? [], today)
}

/** The PSN example's trophies (`set`, its trophy set), in `lang`, the same way. */
export async function loadSampleTrophies(set: string, lang: Lang, today: string): Promise<PsnTrophy[]> {
  const [{ SAMPLE_PSN_TROPHIES, SAMPLE_PSN_ICONS }, names] = await Promise.all([import('./samplePsnTrophies'), NAMES[lang]()])
  return toPsnTrophies(SAMPLE_PSN_TROPHIES, SAMPLE_PSN_ICONS, names[set] ?? [], today)
}
