import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { profileLibrary } from '@/utils/library'

/**
 * Every game the user (or, on a public profile, its owner) has played, across
 * RA, Steam, PSN and Xbox, read from the libraries the page already loads. `hidden`
 * are the "source:id" keys to leave out. Loading until each linked platform answers.
 */
export function useProfileLibrary(hidden: string[] = []) {
  const subject = useSubject()
  const { data: session } = useSession()
  const { all, isLoading: raLoading } = useGamesData()
  const { isLinked: steamLinked, library: steam, libraryLoading: steamLoading } = useSteamGamesData()
  const { isLinked: psnLinked, library: psn, libraryLoading: psnLoading } = usePsnGamesData()
  const { isLinked: xboxLinked, library: xbox, libraryLoading: xboxLoading } = useXboxGamesData()
  const hasRa = Boolean(session?.user?.rausername)

  const games = useMemo(() => profileLibrary(all, steam, psn, hidden, subject, xbox), [all, steam, psn, xbox, hidden, subject])
  const isLoading = (hasRa && raLoading) || (steamLinked && steamLoading) || (psnLinked && psnLoading) || (xboxLinked && xboxLoading)
  return { games, isLoading }
}
