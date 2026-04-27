import Image from 'next/image'
import { CategoryGame } from '../../hooks/useGamesByCategory'
import Link from 'next/link'

export default function StatusGameList({ games }: { games: CategoryGame[] }) {
  return (
    <>
      {games.map((g) => (
        <Link
          href={`/gameInfo/${g.ID ? g.ID : g.GameID}`}
          key={g.ConsoleID}
          className="bg-bg-card w-[95%] p-2 rounded-lg flex flex-row items-start gap-2 hover:transform hover:scale-101 transition-all cursor-pointer"
        >
          <Image
            src={`https://retroachievements.org${g.ImageIcon}`}
            alt={g.Title}
            width={100}
            height={100}
          />
          <div className="flex flex-col">
            <p className="text-xl">{g.Title}</p>
            <p className="text-md">{g.ConsoleName}</p>
          </div>
        </Link>
      ))}
    </>
  )
}
