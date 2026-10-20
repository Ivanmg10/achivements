import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isGameSource } from '@/utils/gameRef'
import { isPsnTitleId } from '@/utils/psnTitles'
import { isXboxTitleId } from '@/utils/xboxTitles'
import UserGamePage from '@/components/user-game-page/UserGamePage'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'

interface Props {
  params: Promise<{ username: string; platform: string; id: string }>
}

/** A game as one user has it: /user/<name>/ra/<id>, /steam/<appid>, /psn/<NPWR…>, /xbox/<title id>. */
export default async function UserGameRoute({ params }: Props) {
  const { username, platform, id: rawId } = await params
  const id = decodeURIComponent(rawId)
  if (!isGameSource(platform)) notFound()
  if (platform === 'psn' ? !isPsnTitleId(id) : platform === 'xbox' ? !isXboxTitleId(id) : !/^\d+$/.test(id)) notFound()

  return (
    // The page reads ?compare=1.
    <Suspense fallback={<GameInfoSkeleton />}>
      <UserGamePage username={decodeURIComponent(username)} source={platform} id={id} />
    </Suspense>
  )
}
