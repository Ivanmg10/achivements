import type { RetroAchievementsGameWithAchievements } from '@/types/types'
import type { SteamAchievementUnified, SteamGameDetails } from '@/types/steam'
import type { PsnGameProgress, PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import type { XboxAchievement, XboxGameProgress } from '@/types/xbox'
import type { IgdbDetails } from '@/lib/igdbClient'
import { BASE_GROUP } from '@/utils/psnTitles'

/**
 * A game's achievements as a file for a chat AI (ChatGPT, Claude, Gemini…),
 * so the player can ask for help with the ones left as if they had typed it
 * all out: what is left, what they already have (oldest first, so the AI can
 * tell how far they are and which choices they made), and instructions that
 * tell the AI what to do with it.
 *
 * The instructions are in English, which models follow best, with one line
 * asking for the answer in the player's language. Nothing about the account
 * goes in: no username, no ids — only the game and its achievements.
 */

type Platform = 'ra' | 'steam' | 'psn' | 'xbox'

/** One achievement, the same for every platform; platform-only fields are left out when absent. */
export type AiAchievement = {
  name: string
  nameEnglish?: string
  description: string | null
  earned: boolean
  earnedAt: string | null
  rarityPercent: number | null
  hidden?: boolean
  /** RA */
  points?: number
  type?: 'progression' | 'win_condition' | 'missable'
  hardcore?: boolean
  /** PSN */
  grade?: 'platinum' | 'gold' | 'silver' | 'bronze'
  dlc?: string
  /** Steam */
  mayNeedOnline?: boolean
  /** Xbox */
  gamerscore?: number
}

export type AiExportSource = {
  platform: Platform
  game: {
    title: string
    console: string
    developer?: string
    publisher?: string
    genre?: string
    released?: string
    playtimeHours?: number
    link?: string
    guide?: string
  }
  /** In the game's own order, which usually follows the story. */
  achievements: AiAchievement[]
  /** PSN: trophies by grade, earned of total. */
  byGrade?: Record<'platinum' | 'gold' | 'silver' | 'bronze', { earned: number; total: number }>
  /** Xbox: gamerscore earned of total. */
  gamerscore?: { earned: number; total: number }
}

const PLATFORM_NAME: Record<Platform, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PlayStation Network', xbox: 'Xbox' }
const NOUN: Record<Platform, string> = { ra: 'achievements', steam: 'achievements', psn: 'trophies', xbox: 'achievements' }

const round1 = (n: number) => Math.round(n * 10) / 10
/** Drops empty fields so the file holds only what is known. */
const compact = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0))) as T
const joined = (list: string[] | undefined) => (list && list.length > 0 ? list.join(', ') : undefined)

// ---------------------------------------------------------------------------
// From each platform's page data
// ---------------------------------------------------------------------------

const RA_TYPES = new Set(['progression', 'win_condition', 'missable'])

export function raAiSource(game: RetroAchievementsGameWithAchievements): AiExportSource {
  const players = game.NumDistinctPlayers ?? 0
  const achievements = Object.values(game.Achievements ?? {})
    .filter((a) => !!a)
    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    .map(
      (a): AiAchievement => ({
        name: a.Title,
        description: a.Description || null,
        earned: !!(a.DateEarned || a.DateEarnedHardcore),
        earnedAt: a.DateEarnedHardcore ?? a.DateEarned ?? null,
        rarityPercent: players > 0 ? round1((a.NumAwarded / players) * 100) : null,
        points: a.Points,
        type: a.Type && RA_TYPES.has(a.Type) ? (a.Type as AiAchievement['type']) : undefined,
        hardcore: !!a.DateEarnedHardcore,
      }),
    )
  return {
    platform: 'ra',
    game: compact({
      title: game.Title ?? '',
      console: game.ConsoleName ?? '',
      developer: game.Developer ?? undefined,
      publisher: game.Publisher ?? undefined,
      genre: game.Genre ?? undefined,
      released: game.Released ?? undefined,
      link: game.ID ? `https://retroachievements.org/game/${game.ID}` : undefined,
      guide: game.GuideURL ?? undefined,
    }),
    achievements,
  }
}

export function steamAiSource({
  appId,
  title,
  achievements,
  details,
  playtimeMinutes,
}: {
  appId: number
  title: string
  achievements: SteamAchievementUnified[]
  details: SteamGameDetails | null
  playtimeMinutes: number | null
}): AiExportSource {
  return {
    platform: 'steam',
    game: compact({
      title,
      console: 'PC (Steam)',
      developer: joined(details?.developers),
      publisher: joined(details?.publishers),
      genre: joined(details?.genres),
      released: details?.releaseDate ?? undefined,
      playtimeHours: playtimeMinutes ? round1(playtimeMinutes / 60) : undefined,
      link: `https://store.steampowered.com/app/${appId}`,
    }),
    achievements: [...achievements]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((a) => ({
        name: a.title,
        nameEnglish: a.titleEn,
        // Steam keeps a hidden achievement's description back until it is unlocked.
        description: a.description || null,
        earned: a.earned,
        earnedAt: a.dateEarned,
        rarityPercent: a.globalPct !== null ? round1(a.globalPct) : null,
        hidden: a.hidden,
        mayNeedOnline: a.likelyOnline,
      })),
  }
}

export function psnAiSource({
  game,
  trophies,
  groups,
  details,
}: {
  game: PsnGameProgress
  trophies: PsnTrophy[]
  groups: PsnTrophyGroup[]
  details: IgdbDetails | null
}): AiExportSource {
  const dlcName = new Map(groups.filter((g) => g.id !== BASE_GROUP).map((g) => [g.id, g.name]))
  const grades = ['platinum', 'gold', 'silver', 'bronze'] as const
  return {
    platform: 'psn',
    game: compact({
      title: game.title,
      console: game.consoleName,
      developer: joined(details?.developers),
      publisher: joined(details?.publishers),
      genre: joined(details?.genres),
      released: details?.releaseDate ?? undefined,
      playtimeHours: game.playtimeMinutes ? round1(game.playtimeMinutes / 60) : undefined,
      link: game.conceptId !== null ? `https://store.playstation.com/concept/${game.conceptId}` : undefined,
    }),
    achievements: [...trophies]
      .sort((a, b) => a.id - b.id)
      .map((t) => ({
        name: t.name,
        description: t.detail || null,
        earned: t.earned,
        earnedAt: t.earnedAt,
        rarityPercent: t.rarity !== null ? round1(t.rarity) : null,
        hidden: t.hidden,
        grade: t.type,
        dlc: dlcName.get(t.groupId),
      })),
    byGrade: Object.fromEntries(grades.map((g) => [g, { earned: game.earned[g], total: game.defined[g] }])) as AiExportSource['byGrade'],
  }
}

export function xboxAiSource({
  game,
  achievements,
  details,
}: {
  game: XboxGameProgress
  achievements: XboxAchievement[]
  details: IgdbDetails | null
}): AiExportSource {
  return {
    platform: 'xbox',
    game: compact({
      title: game.title,
      console: game.consoleName,
      developer: joined(details?.developers),
      publisher: joined(details?.publishers),
      genre: joined(details?.genres),
      released: details?.releaseDate ?? undefined,
    }),
    // Xbox sends them in the game's own order.
    achievements: achievements.map((a) => ({
      name: a.name,
      description: a.description || null,
      earned: a.unlocked,
      earnedAt: a.unlockedAt,
      rarityPercent: a.rarity !== null ? round1(a.rarity) : null,
      hidden: a.secret,
      gamerscore: a.gamerscore,
    })),
    gamerscore: { earned: game.earnedGamerscore, total: game.totalGamerscore },
  }
}

// ---------------------------------------------------------------------------
// The instructions
// ---------------------------------------------------------------------------

function platformNotes(source: AiExportSource): string[] {
  if (source.platform === 'ra') {
    return [
      'This is a RetroAchievements set: achievements made by the RetroAchievements community for a retro game played on an emulator, not the game\'s official ones. Your knowledge of the game helps, but each achievement\'s requirements are exactly what its description says, which can be stricter than a similar official one.',
      '"type": "missable" can be lost for the rest of the playthrough if not done at the right moment; "progression" is earned by advancing the story; "win_condition" by finishing the game. Achievements with no type can usually be done at any time.',
      '"points" are RetroAchievements points: a rough sign of difficulty, not of length.',
      '"hardcore": true means it was earned in hardcore mode (no save states, rewind, slow motion or cheats); earned ones without it were earned in softcore. Achievements earned only in softcore count for completion but not for mastery; if the player wants mastery they must earn those again in hardcore. When it matters, mention whether a tip relies on something hardcore forbids.',
      'If "game.guide" is present, it is the RetroAchievements guide for this set; point the player to it for anything long or detailed.',
    ]
  }
  if (source.platform === 'steam') {
    return [
      'These are the game\'s Steam achievements. "nameEnglish" is the official English name when the player\'s list is in another language; guides and wikis use it.',
      '"hidden": true marks a secret achievement. Steam does not reveal a hidden achievement\'s description until it is unlocked, so "description" may be missing: identify it by its name, and say so if you cannot.',
      '"mayNeedOnline": true is only a guess made from the description (Steam has no such flag), so it can be wrong either way. For online or multiplayer achievements, say whether the official servers are likely still up (or not, if you know they were shut down), whether they need other players, and any offline or private-match alternative.',
      '"playtimeHours" is how long the player has played the game, a hint of how far they are.',
    ]
  }
  if (source.platform === 'xbox') {
    return [
      'These are the game\'s Xbox achievements. "gamerscore" is the points each one gives (the G of Xbox); it is a rough sign of difficulty. "progress.gamerscore" shows how much of the total the player already has, and the completion percentage Xbox shows is by gamerscore, not by count.',
      '"hidden": true marks a secret achievement: the player can see its name and description here, but keep story spoilers out of the explanation.',
      'Some achievements are tied to online play, to a specific difficulty or to a single playthrough and cannot be undone once missed; say so when you know it. Xbox 360 games and newer ones list their achievements the same way here.',
    ]
  }
  return [
    'These are the game\'s PlayStation trophies. "grade" is bronze, silver, gold or platinum. The platinum unlocks when every base-game trophy is earned; DLC trophies are not needed for it but count towards 100%.',
    '"dlc" names the DLC pack a trophy belongs to; trophies without it are from the base game. Deal with base-game trophies first unless the player asks about a DLC.',
    '"hidden": true marks a secret trophy: the player can see its name and description here, but keep story spoilers out of the explanation.',
    'If "byGrade" shows a platinum still to earn, say clearly what stands between the player and it.',
    '"playtimeHours" is how long the player has played the game, when Sony reports it, a hint of how far they are.',
  ]
}

function instructions(source: AiExportSource, replyIn: string, question: string | null): string[] {
  const noun = NOUN[source.platform]
  return [
    `You are an expert ${noun} hunter and game guide. The player is working on "${source.game.title}" (${source.game.console}, ${PLATFORM_NAME[source.platform]}) and wants help with the ${noun} they still have left. This file, exported from their tracker CheevoVault, holds the game's full list and which ones they already have.`,
    `Reply in ${replyIn}. Keep the names exactly as they appear in this file (they may be translated), adding the official English name in brackets when you know it and it differs.`,
    question
      ? `The player asks: "${question}". Answer that first and in full, using the data below; then offer the rest of the plan described next, briefly.`
      : 'The player has not asked anything specific yet: start with the plan described next.',

    'HOW TO READ THE DATA',
    `"pending": the ${noun} still to earn, in the game's own order, which usually follows the story. This is what the player needs help with.`,
    `"earned": the ones they already have, oldest first, with the date. Use the order and the descriptions to work out how far they are and which routes, choices, characters or difficulty they have already gone through — for instance, which story branch an ending implies. Say when you are inferring rather than reading it.`,
    '"rarityPercent": the share of players who have it. Very low usually means hard, long or easy to miss.',
    ...platformNotes(source),

    'WHAT TO DO',
    '1. Status in two or three lines: how many are left and what kind they are.',
    '2. Time-sensitive first: anything missable, points of no return, choices that lock out other achievements, and online ones whose servers may be shut down or that need other players.',
    '3. Group the pending ones by what they need: story and choices, collectibles, difficulty, skill or challenge, online and multiplayer, DLC, grind or cumulative counters, other.',
    '4. The most efficient route to get the rest, given what they have already done: what can be stacked in one run, whether chapter or mission select can clean up afterwards, what needs a new save or playthrough, and in which order.',
    '5. For each pending one, a short "how to get it": requirements, where or when, and a tip. Keep each brief; offer detail on request.',
    '6. End by asking which one they want to tackle first, or offering a step-by-step walkthrough of the next one in the route.',

    'RULES',
    `- Talk only about the ${noun} in this file; never invent others. If you do not recognise one, reason from its name and description and say you are not certain.`,
    '- Be honest about uncertainty: separate what you know from what you assume, and suggest checking a guide or video for anything you are unsure of, since versions, platforms and patches can differ.',
    '- Avoid story spoilers beyond what is needed to explain how to get something, unless the player asks for them.',
    '- Do not repeat this file back, and do not list the earned ones one by one.',
    '- Use short headings and lists; this will be read on a phone as often as on a computer.',
  ]
}

// ---------------------------------------------------------------------------
// The file
// ---------------------------------------------------------------------------

export type AiExport = ReturnType<typeof buildAiExport>

/** The language to answer in, by name ("es" → "Spanish"), so the AI cannot misread a code. */
export function languageName(lang: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) ?? 'English'
  } catch {
    return 'English'
  }
}

export function buildAiExport(source: AiExportSource, { lang, question = '', now = new Date() }: { lang: string; question?: string; now?: Date }) {
  const asked = question.trim() || null
  const all = source.achievements
  const earned = all
    .filter((a) => a.earned)
    // Undated ones (unlocked before the platform kept dates) first: they are the oldest.
    .sort((a, b) => (a.earnedAt ?? '').localeCompare(b.earnedAt ?? ''))
    .map((a) =>
      compact({
        name: a.name,
        nameEnglish: a.nameEnglish,
        description: a.description,
        earnedAt: a.earnedAt,
        hardcore: source.platform === 'ra' ? a.hardcore : undefined,
        grade: a.grade,
        dlc: a.dlc,
        gamerscore: a.gamerscore,
      }),
    )
  const pending = all
    .filter((a) => !a.earned)
    .map((a) =>
      compact({
        name: a.name,
        nameEnglish: a.nameEnglish,
        description: a.description,
        rarityPercent: a.rarityPercent,
        type: a.type,
        points: a.points,
        grade: a.grade,
        dlc: a.dlc,
        gamerscore: a.gamerscore,
        hidden: a.hidden,
        mayNeedOnline: a.mayNeedOnline,
      }),
    )
  const total = all.length
  const points = (list: AiAchievement[]) => list.reduce((sum, a) => sum + (a.points ?? 0), 0)

  return {
    instructions: instructions(source, languageName(lang), asked),
    playerQuestion: asked ?? undefined,
    exportedFrom: 'CheevoVault',
    exportedAt: now.toISOString(),
    game: { platform: PLATFORM_NAME[source.platform], ...source.game },
    progress: compact({
      earned: earned.length,
      total,
      percent: total > 0 ? Math.round((earned.length / total) * 100) : 0,
      hardcoreEarned: source.platform === 'ra' ? all.filter((a) => a.hardcore).length : undefined,
      pointsEarned: source.platform === 'ra' ? points(all.filter((a) => a.earned)) : undefined,
      pointsTotal: source.platform === 'ra' ? points(all) : undefined,
      byGrade: source.byGrade,
      gamerscore: source.gamerscore,
    }),
    pending,
    earned,
  }
}

/**
 * The same as plain text to paste into a chat: the instructions as prose,
 * then the data as JSON. Pasting needs no file upload, which some chats and
 * phones make awkward.
 */
export function aiExportText(file: AiExport): string {
  const { instructions: lines, ...data } = file
  return `${lines.join('\n')}\n\nDATA (JSON):\n${JSON.stringify(data, null, 2)}`
}

/** "call-of-duty-black-ops-ii-psn-ai.json". */
export function aiExportFileName(title: string, platform: Platform): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'game'}-${platform}-ai.json`
}
