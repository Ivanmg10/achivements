export default function GameInfoHeaderStatsBadge({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
        done ? 'bg-success/20 text-success' : 'bg-bg-tertiary text-text-main'
      }`}
    >
      <span className="uppercase tracking-wide text-[10px] opacity-70">{label}</span>
      <span className="text-base font-bold whitespace-nowrap">{value}</span>
    </div>
  )
}
