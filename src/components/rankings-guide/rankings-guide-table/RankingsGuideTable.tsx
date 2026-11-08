import DataBar from '@/components/ui/DataBar'

/**
 * A two-column table of the guide (a rarity and what it is worth, say), the
 * value column right-aligned and, when `weights` are given (0–1, one a row), a
 * slanted bar between them as long as the weight.
 */
export default function RankingsGuideTable({ head, rows, weights }: { head: [string, string]; rows: [string, string][]; weights?: number[] }) {
  return (
    <div className="bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] rounded-pane overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left text-[0.8125rem] font-semibold text-text-secondary shadow-hairline-b">{head[0]}</th>
            {weights && <th scope="col" aria-hidden="true" className="shadow-hairline-b w-1/3" />}
            <th scope="col" className="px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-text-secondary shadow-hairline-b">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label}>
              <td className="px-4 py-2.5 shadow-hairline-b-soft">{label}</td>
              {weights && (
                <td aria-hidden="true" className="px-2 shadow-hairline-b-soft">
                  <DataBar track share={Math.max(0.04, weights[i] ?? 0)} className="h-2" />
                </td>
              )}
              <td className="px-4 py-2.5 text-right text-base font-extrabold tabular-nums shadow-hairline-b-soft">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
