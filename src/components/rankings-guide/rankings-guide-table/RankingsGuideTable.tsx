/** A two-column table of the guide (a rarity and what it is worth, say), the value column right-aligned. */
export default function RankingsGuideTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="bg-bg-card rounded-card overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-ink/[0.07]">
            <th scope="col" className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider font-bold text-text-secondary">{head[0]}</th>
            <th scope="col" className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider font-bold text-text-secondary">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-ink/[0.05] last:border-0">
              <td className="px-4 py-2">{label}</td>
              <td className="px-4 py-2 text-right font-bold tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
