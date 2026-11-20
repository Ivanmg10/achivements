import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import { IGDB_COVER } from '@/utils/coverRatio'

export default function GameLoading() {
  return <GameInfoSkeleton ratio={IGDB_COVER} />
}
