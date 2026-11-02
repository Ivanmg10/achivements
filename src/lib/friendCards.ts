import { NextRequest } from 'next/server'
import { GET as raRecent } from '@/app/api/getRecentAchievements/route'
import { GET as raGames } from '@/app/api/getGamesCompleted/route'
import { GET as steamActivity } from '@/app/api/steam/activity/route'
import { GET as steamOwned } from '@/app/api/steam/ownedGames/route'
import { GET as psnRecent } from '@/app/api/psn/recentTrophies/route'
import { GET as psnTitles } from '@/app/api/psn/titles/route'
import { GET as xboxRecent } from '@/app/api/xbox/recentAchievements/route'
import { GET as xboxTitles } from '@/app/api/xbox/titles/route'
import { mapLimit } from '@/utils/utils'
import { toSteamLanguage } from '@/utils/steamLanguage'
import { friendDetails, type FriendDetails, type FriendLists, type FriendOverview } from '@/utils/friends'

type Handler = (req: NextRequest) => Promise<Response>

/**
 * One of a friend's lists, through the very route their profile uses, called in
 * this process with `?user=`: so each read keeps that route's rules exactly
 * (dataOwner and whose RA key, a private profile, Xbox for admins, hidden games,
 * the caches and their pace) instead of a second copy of them (#101).
 */
async function read<T>(origin: string, handler: Handler, path: string): Promise<T[]> {
  const res = await handler(new NextRequest(new URL(path, origin)))
  if (!res.ok) throw new Error(`${path.split('?')[0]} ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`${path.split('?')[0]}: not a list`)
  return data as T[]
}

/** One friend's card data: the eight lists their profile shows, each failing on its own (then `partial`). */
async function loadOne(origin: string, friend: FriendOverview, lang: string): Promise<FriendDetails> {
  const user = `user=${encodeURIComponent(friend.username)}`
  const steamLang = toSteamLanguage(lang)
  const none = Promise.resolve([] as never[])
  const calls = await Promise.allSettled([
    friend.ra ? read(origin, raRecent as Handler, `/api/getRecentAchievements?${user}`) : none,
    friend.steam ? read(origin, steamActivity as Handler, `/api/steam/activity?lang=${steamLang}&${user}`) : none,
    friend.psn ? read(origin, psnRecent as Handler, `/api/psn/recentTrophies?scope=activity&lang=${lang}&${user}`) : none,
    // Only a viewer who may see Xbox is told the friend has it (see /api/follows/overview); the route checks again.
    friend.xbox ? read(origin, xboxRecent as Handler, `/api/xbox/recentAchievements?scope=activity&lang=${lang}&${user}`) : none,
    friend.ra ? read(origin, raGames as Handler, `/api/getGamesCompleted?${user}`) : none,
    friend.steam ? read(origin, steamOwned as Handler, `/api/steam/ownedGames?${user}`) : none,
    friend.psn ? read(origin, psnTitles as Handler, `/api/psn/titles?${user}`) : none,
    friend.xbox ? read(origin, xboxTitles as Handler, `/api/xbox/titles?${user}`) : none,
  ])
  const failed = calls.filter((c) => c.status === 'rejected')
  for (const f of failed) console.error('[friendCards]', friend.username, (f as PromiseRejectedResult).reason)
  const [raR, steamR, psnR, xboxR, raG, steamG, psnG, xboxG] = calls.map((c) => (c.status === 'fulfilled' ? c.value : []))
  const lists = {
    raRecent: raR, steamRecent: steamR, psnRecent: psnR, xboxRecent: xboxR,
    raGames: raG, steamGames: steamG, psnGames: psnG, xboxGames: xboxG,
  } as FriendLists
  return friendDetails(friend, lists, failed.length > 0)
}

/**
 * The cards of the people you follow (or who follow you), read on the server in
 * one answer instead of up to eight requests a person from the browser (#101).
 * `atOnce` people at a time, the pace each list had in the browser (one for the
 * people you follow: Xbox's hourly budget, see #87). The upstream reads are the
 * same ones, through the same caches: fewer requests, not more platform calls.
 */
export async function loadFriendCards(origin: string, friends: FriendOverview[], lang: string, atOnce: number): Promise<Record<string, FriendDetails>> {
  const details: Record<string, FriendDetails> = {}
  await mapLimit(friends, atOnce, async (friend) => {
    details[friend.username] = await loadOne(origin, friend, lang)
  })
  return details
}
