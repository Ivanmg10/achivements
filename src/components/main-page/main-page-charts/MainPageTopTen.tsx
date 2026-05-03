import { TopTenUser } from '@/types/types'

export default function MainPageTopTen({
  topTen,
  isLoading,
  currentUsername,
}: {
  topTen: TopTenUser[]
  isLoading?: boolean
  currentUsername?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Top 10 global players</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm">Loading...</div>
      ) : topTen.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-text-secondary text-sm">No data</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {topTen.map((u, i) => {
            const username = u[1]
            const pts = Number(u[2]).toLocaleString()
            const isMe = currentUsername && username.toLowerCase() === currentUsername.toLowerCase()
            return (
              <div
                key={username}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isMe ? 'bg-accent/10 ring-1 ring-accent/30' : 'bg-bg-main'}`}
              >
                <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-text-secondary'}`}>
                  {i + 1}
                </span>
                <span className={`text-xs font-semibold flex-1 truncate ${isMe ? 'text-accent' : 'text-text-main'}`}>
                  {username}
                </span>
                <span className="text-xs text-text-secondary shrink-0">{pts}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
