const SLANT = { clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }

/**
 * A two-column table of the guide (a rarity and what it is worth, say), the
 * value column right-aligned and, when `weights` are given (0–1, one a row), a
 * slanted bar between them as long as the weight.
 */
export default function RankingsGuideTable({ head, rows, weights }: { head: [string, string]; rows: [string, string][]; weights?: number[] }) {
  return (
    <div className="bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] rounded-[0.875rem] overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left text-[0.6875rem] uppercase tracking-[0.08em] font-bold text-text-secondary shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">{head[0]}</th>
            {weights && <th scope="col" aria-hidden="true" className="shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)] w-1/3" />}
            <th scope="col" className="px-4 py-2.5 text-right text-[0.6875rem] uppercase tracking-[0.08em] font-bold text-text-secondary shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label}>
              <td className="px-4 py-2.5 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)]">{label}</td>
              {weights && (
                <td aria-hidden="true" className="px-2 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)]">
                  <span className="block h-2 bg-ink/[0.08]" style={SLANT}>
                    <span className="block h-full bg-accent" style={{ ...SLANT, width: `${Math.max(4, (weights[i] ?? 0) * 100)}%` }} />
                  </span>
                </td>
              )}
              <td className="px-4 py-2.5 text-right text-base font-extrabold tabular-nums shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)]">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
