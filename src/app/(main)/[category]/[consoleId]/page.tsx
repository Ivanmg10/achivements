'use client'

import { useParams } from 'next/navigation'
import { useGamesByCategory } from '../../../../hooks/useGamesByCategory'
import StatusGameList from '../../../../components/statusGameList/StatusGameList'
// import NoMainHeader from '../../../../components/no-main-header/NoMainHeader'
import Spinner from '../../../../components/main-spinner/Spinner'
import { useLanguage } from '@/context/LanguageContext'

export default function WantToPlay() {
  const { consoleId, category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string, consoleId as string)
  const { T } = useLanguage()

  const handleNoContentText = (category: string) => {
    switch (category) {
      case 'wantToPlay':
        return T.categoryPage.noWantToPlay
      case 'playing':
        return T.categoryPage.noPlaying
      case 'completed':
        return T.categoryPage.noCompleted
    }
  }

  if (error) return <p>Error: {error}</p>
  if (loading) return <Spinner size={45} />
  return (
    <div className="flex flex-col items-center justify-start gap-4 p-4 text-white min-h-screen bg-bg-main">
      {/* <NoMainHeader /> */}
      {games.length == 0 ? (
        <h1 className="text-3xl">{handleNoContentText(category as string)}</h1>
      ) : (
        <StatusGameList games={games} />
      )}
    </div>
  )
}
