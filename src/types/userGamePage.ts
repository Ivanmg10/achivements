import type { ReactNode } from 'react'
import type { CompareAchievement } from '@/utils/gameCompare'

/** What `UserGamePage` hands each platform's body (read inside SubjectProviders). */
export type UserGamePlatformProps = {
  /** The game as its URL has it. */
  id: string
  username: string
  banner: ReactNode
  comparing: boolean
  mine: CompareAchievement[] | null
  mineLoading: boolean
  notice?: ReactNode
}
