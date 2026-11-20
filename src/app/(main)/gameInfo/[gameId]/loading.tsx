import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import { raBoxRatio } from '@/utils/coverRatio'

export default function GameLoading() {
  return <GameInfoSkeleton ratio={raBoxRatio(null)} />
}
