import { RecentAchievement, RetroAchievementsGameWithAchievements, RetroAchievementsUserProfile } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-1">
      <span className={`text-xl font-bold ${accent ?? 'text-white'}`}>{value.toLocaleString()}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function CompletionBar({ label, value, color = 'bg-yellow-500' }: { label: string; value: string; color?: string }) {
  const pct = parseFloat(value) || 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-bg-main rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}


export default function MainPageProfileRa({
  user,
  game,
  recentAchievements,
}: {
  user: RetroAchievementsUserProfile | null | undefined
  game: RetroAchievementsGameWithAchievements | null | undefined
  recentAchievements: RecentAchievement[]
}) {
  const hardcoreRatio =
    user && user.TotalTruePoints > 0
      ? Math.round((user.TotalTruePoints / (user.TotalPoints || 1)) * 100)
      : 0

  const ringColor =
    hardcoreRatio >= 80
      ? 'ring-yellow-400'
      : hardcoreRatio >= 50
        ? 'ring-blue-400'
        : 'ring-gray-600'

  const memberYear = user?.MemberSince ? new Date(user.MemberSince).getFullYear() : null

  const hasContribs = user && (user.ContribCount > 0 || user.ContribYield > 0)

  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2 h-full">
      {user?.User ? (
        <>
          {/* Header */}
          <div className="flex gap-3 items-center">
            {user?.UserPic && (
              <Image
                src={`https://retroachievements.org${user.UserPic}`}
                alt="UserPic"
                width={90}
                height={90}
                className={`m-1 rounded-lg ring-2 ${ringColor}`}
              />
            )}
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold leading-tight">{user.User}</p>
              {user.Motto && (
                <p className="text-xs text-gray-400 italic">&ldquo;{user.Motto}&rdquo;</p>
              )}
              {memberYear && (
                <p className="text-xs text-gray-500">Miembro desde {memberYear}</p>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Puntos hardcore" value={user.TotalPoints} accent="text-yellow-400" />
            <StatCard label="Puntos verdaderos" value={user.TotalTruePoints} accent="text-blue-400" />
            <StatCard label="Puntos softcore" value={user.TotalSoftcorePoints} />
            <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-1">
              <span className="text-xl font-bold text-green-400">{hardcoreRatio}%</span>
              <span className="text-xs text-gray-400">Ratio hardcore</span>
            </div>
          </div>

          {/* Juego actual */}
          {game && (
            <Link
              className="bg-bg-card rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.02] transition-transform duration-200"
              href={`/gameInfo/${game.ID}`}
            >
              <p className="text-xs text-gray-400 uppercase tracking-wider">Jugando ahora</p>
              <p className="text-xs text-gray-300 italic">{user?.RichPresenceMsg}</p>
              <div className="flex gap-3 items-center">
                <Image
                  src={`https://retroachievements.org/${game.ImageIcon}`}
                  alt="GameIcon"
                  width={50}
                  height={50}
                  className="rounded-lg shrink-0"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold truncate">{game.Title}</span>
                  <span className="text-xs text-gray-400">{game.ConsoleName}</span>
                </div>
              </div>
              {game.UserCompletion && (
                <div className="flex flex-col gap-2">
                  <CompletionBar label="Normal" value={game.UserCompletion} />
                  {game.UserCompletionHardcore && (
                    <CompletionBar label="Hardcore" value={game.UserCompletionHardcore} color="bg-orange-500" />
                  )}
                </div>
              )}
            </Link>
          )}

          {/* Logros recientes */}
          {recentAchievements.length > 0 && (
            <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Logros recientes</p>
              <div className="flex flex-col gap-2">
                {recentAchievements.slice(0, 5).map((ach) => (
                  <div key={ach.AchievementID} className="flex gap-2 items-center">
                    <Image
                      src={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
                      alt={ach.Title}
                      width={36}
                      height={36}
                      className="rounded shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate">{ach.Title}</span>
                      <span className="text-xs text-gray-500 truncate">{ach.GameTitle}</span>
                    </div>
                    <span className={`text-xs ml-auto shrink-0 ${ach.HardcoreMode === '1' ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {ach.Points}pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contribuciones */}
          {hasContribs && (
            <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Contribuciones</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-purple-400">{user.ContribCount.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">Logros creados</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-pink-400">{user.ContribYield.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">Puntos aportados</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          Iniciar sesion con Retroachivements
        </Link>
      )}
    </div>
  )
}
