import { slantStyle } from '@/components/ui/shape'
import Kicker from '@/components/ui/Kicker'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'
import DesignCatalogEntrances from '../design-catalog-entrances/DesignCatalogEntrances'

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
const PLATFORM: [string, string, string][] = [
  ['ra · ra-gold', 'bg-ra', 'RetroAchievements'],
  ['steam · steam-dark', 'bg-steam', 'Steam'],
  ['steam-perfect', 'bg-steam-perfect', 'a Steam game at 100 %'],
  ['psn · psn-dark', 'bg-psn', 'PlayStation'],
  ['platinum', 'bg-platinum', 'a PlayStation platinum'],
  ['xbox', 'bg-xbox', 'Xbox'],
]
const LINES: [string, string][] = [
  ['shadow-hairline-t / -b', 'shadow-hairline-b'],
  ['shadow-hairline-b-soft', 'shadow-hairline-b-soft'],
  ['shadow-sunken', 'shadow-sunken'],
]
const INK: [string, string][] = [['ink/6', 'bg-ink/[0.06]'], ['ink/12', 'bg-ink/[0.12]'], ['ink/20', 'bg-ink/20']]
const RADII = ['rounded-cell', 'rounded-box-sm', 'rounded-box-md', 'rounded-box', 'rounded-tag-sm', 'rounded-badge', 'rounded-tag', 'rounded-chip', 'rounded-icon', 'rounded-button', 'rounded-control', 'rounded-tile', 'rounded-area', 'rounded-pane', 'rounded-field', 'rounded-sheet', 'rounded-card']
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
          <div className="flex flex-wrap gap-4">{PLATFORM.map(([n, c, u]) => <Swatch key={n} name={n} cls={c} use={u} />)}</div>
          <div className="flex flex-wrap gap-4">
            {LINES.map(([n, c]) => <Swatch key={n} name={n} cls={`bg-bg-main ${c}`} />)}
            <div className="flex flex-col gap-1.5 w-28">
              <button type="button" className="h-14 rounded-control bg-bg-main ring-1 ring-ink/15 text-xs text-text-secondary focus-ring">Tab here</button>
              <code className="text-xs">focus-ring</code>
            </div>
            <div className="flex flex-col gap-1.5 w-28">
              <span aria-hidden="true" className="h-14 grid place-items-center"><span className="block h-2 w-20 bg-progress drop-shadow-done" /></span>
              <code className="text-xs">drop-shadow-done</code>
            </div>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="type">
        <Panel>
          <p className="font-display italic font-extrabold text-6xl leading-[0.9] pr-2">Display 72</p>
          <p className="font-display italic font-extrabold text-4xl leading-[0.95] pr-2">Display 40 — a section title</p>
          <Kicker tone="accent" size="md">Kicker, uppercase, tracked</Kicker>
          <div className="grid gap-1 sm:grid-cols-2">
            {([400, 500, 600, 700, 800] as const).map((w) => (
              <p key={w} style={{ fontWeight: w }} className="text-lg">Barlow {w} — Ultimate Spider-Man</p>
            ))}
            <p className="text-2xl font-extrabold tabular-nums">143.820 <span className="text-sm font-normal text-text-secondary">tabular figures</span></p>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="kicker">
        <Panel>
          {(['xs', 'sm', 'md'] as const).map((size) => (
            <Specimen key={size} name={`size ${size} · muted · accent · danger`}>
              <Kicker as="span" size={size}>Last 7 days</Kicker>
              <Kicker as="span" size={size} tone="accent">Step 2 of 8</Kicker>
              <Kicker as="span" size={size} tone="danger">Failed to load</Kicker>
            </Specimen>
          ))}
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="shape">
        <Compare>
          <Specimen name="Radii: chip, tag, button, tile, pane, field, card">
            {RADII.map((r) => <span key={r} aria-hidden="true" className={`h-12 w-16 bg-ink/15 ring-1 ring-ink/20 ${r}`} />)}
          </Specimen>
          <Specimen name="slantStyle(3 · 8 · 14)">
            <span aria-hidden="true" className="h-3 w-24 bg-accent" style={slantStyle(3)} />
            <span aria-hidden="true" className="h-3 w-24 bg-accent" style={slantStyle(8)} />
            <span aria-hidden="true" className="h-8 w-24 bg-accent" style={slantStyle(14)} />
          </Specimen>
          <Specimen name="--slant-line · --slant-mark">
            <span aria-hidden="true" className="h-1 w-24 bg-accent rounded-(--bar-radius) skew-x-(--slant-line)" />
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
          <DesignCatalogEntrances />
        </Panel>
      </DesignCatalogPiece>
    </>
  )
}
