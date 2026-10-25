import { slantStyle } from '@/components/ui/shape'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'

const SURFACES: [string, string, string][] = [
  ['bg-main', 'bg-bg-main', 'the page'],
  ['bg-card', 'bg-bg-card', 'a card'],
  ['bg-header', 'bg-bg-header', 'the top bar'],
]
const MEANING: [string, string, string][] = [
  ['accent', 'bg-accent', 'primary actions, the current thing'],
  ['success', 'bg-success', 'done, online'],
  ['warning', 'bg-warning', 'caution'],
  ['danger', 'bg-danger', 'destructive, errors'],
  ['info', 'bg-info', 'neutral news'],
  ['hardcore', 'bg-hardcore', 'RA hardcore'],
  ['softcore', 'bg-softcore', 'RA softcore'],
]
const INK: [string, string][] = [['ink/6', 'bg-ink/[0.06]'], ['ink/12', 'bg-ink/[0.12]'], ['ink/20', 'bg-ink/20']]
const RADII = ['rounded-chip', 'rounded-button', 'rounded-control', 'rounded-field', 'rounded-card']
const MOTION: [string, string][] = [['--motion-hover', '150ms'], ['--motion-open', '250ms'], ['--motion-indicator', '450ms']]

function Swatch({ name, cls, use }: { name: string; cls: string; use?: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-28">
      <span aria-hidden="true" className={`h-14 rounded-control ring-1 ring-ink/15 ${cls}`} />
      <code className="text-xs">{name}</code>
      {use && <span className="text-[0.6875rem] leading-tight text-text-secondary">{use}</span>}
    </div>
  )
}

/** The base of the system: colour, type, the two designs' shapes, and motion. */
export default function DesignCatalogFoundations() {
  return (
    <>
      <DesignCatalogPiece id="colour">
        <Panel>
          <div className="flex flex-wrap gap-4">
            {SURFACES.map(([n, c, u]) => <Swatch key={n} name={n} cls={c} use={u} />)}
            <div className="flex flex-col gap-1.5 w-28">
              <span aria-hidden="true" className="h-14 rounded-control ring-1 ring-ink/15 bg-bg-main grid place-items-center text-xl font-extrabold">Aa</span>
              <code className="text-xs">text-main</code>
              <span className="text-[0.6875rem] text-text-secondary">text-secondary for what supports it</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">{MEANING.map(([n, c, u]) => <Swatch key={n} name={n} cls={c} use={u} />)}</div>
          <div className="flex flex-wrap gap-4">{INK.map(([n, c]) => <Swatch key={n} name={n} cls={c} use="tints of the text colour: hairlines and washes" />)}</div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="type">
        <Panel>
          <p className="font-display italic font-extrabold text-6xl leading-[0.9] pr-2">Display 72</p>
          <p className="font-display italic font-extrabold text-4xl leading-[0.95] pr-2">Display 40 — a section title</p>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-accent">Kicker, uppercase, tracked</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {([400, 500, 600, 700, 800] as const).map((w) => (
              <p key={w} style={{ fontWeight: w }} className="text-lg">Barlow {w} — Ultimate Spider-Man</p>
            ))}
            <p className="text-2xl font-extrabold tabular-nums">143.820 <span className="text-sm font-normal text-text-secondary">tabular figures</span></p>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="shape">
        <Compare>
          <Specimen name="Radii: chip, button, control, field, card">
            {RADII.map((r) => <span key={r} aria-hidden="true" className={`h-12 w-16 bg-ink/15 ring-1 ring-ink/20 ${r}`} />)}
          </Specimen>
          <Specimen name="slantStyle(3 · 8 · 14)">
            <span aria-hidden="true" className="h-3 w-24 bg-accent" style={slantStyle(3)} />
            <span aria-hidden="true" className="h-3 w-24 bg-accent" style={slantStyle(8)} />
            <span aria-hidden="true" className="h-8 w-24 bg-accent" style={slantStyle(14)} />
          </Specimen>
          <Specimen name="--slant-line · --slant-mark">
            <span aria-hidden="true" className="h-1 w-24 bg-accent skew-x-(--slant-line)" />
            <span aria-hidden="true" className="h-9 w-1 bg-accent skew-y-(--slant-mark)" />
          </Specimen>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="motion">
        <Panel>
          <div className="flex flex-wrap gap-4">
            {MOTION.map(([token, ms]) => (
              <Specimen key={token} name={`${token} · ${ms}`}>
                <span
                  tabIndex={0}
                  className="h-12 w-36 rounded-control bg-ink/10 hover:bg-accent focus-visible:bg-accent grid place-items-center text-xs font-semibold text-text-secondary hover:text-bg-main motion-reduce:transition-none"
                  style={{ transitionProperty: 'background-color, color', transitionDuration: `var(${token})` }}
                >
                  Hover or focus
                </span>
              </Specimen>
            ))}
          </div>
        </Panel>
      </DesignCatalogPiece>
    </>
  )
}
