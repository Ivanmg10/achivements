'use client'

import { useParams } from 'next/navigation'
import { useGamesByCategory } from '../../../../hooks/useGamesByCategory'
import StatusGameList from '../../../../components/statusGameList/StatusGameList'
import NoMainHeader from '../../../../components/no-main-header/NoMainHeader'
import Spinner from '../../../../components/main-spinner/Spinner'

export default function WantToPlay() {
  const { consoleId, category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string, consoleId as string)

  const handleNoContentText = (category: string) => {
    switch (category) {
      case 'wantToPlay':
        return 'No tienes juegos que quieras jugar en esta consola'
      case 'playing':
        return 'No estas jugando ningun juego en esta consola'
      case 'completed':
        return 'No has completado ningun juego en esta consola'
    }
  }

  if (error) return <p>Error: {error}</p>
  if (loading) return <Spinner size={45} />
  return (
    <div className="flex flex-col items-center justify-start gap-4 p-4 text-white min-h-screen">
      <NoMainHeader />
      {games.length == 0 ? (
        <h1 className="text-3xl">{handleNoContentText(category as string)}</h1>
      ) : (
        <StatusGameList games={games} />
      )}
    </div>
  )
}
