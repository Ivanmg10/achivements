import { MARK, SLANT_PLATE } from '@/components/ui/shape'
import Kicker from '@/components/ui/Kicker'
import BrandMark from '@/components/ui/BrandMark'
import ThemeScreen from '@/components/ui/ThemeScreen'
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
const OTHER_HUES: [string, string, string][] = [
  ['silver · silver-light', 'bg-silver', 'a PlayStation silver, the medals'],
  ['gold-ink · bronze-ink', 'bg-gold-ink', 'ink on a medal'],
  ['status-playing', 'bg-status-playing', 'playing (-bg: its tint)'],
  ['status-want', 'bg-status-want', 'want to play (-bg: its tint)'],
  ['status-done-bg', 'bg-status-done-bg', 'completed, under the success text'],
  ['hardcore-deep', 'bg-hardcore-deep', 'a tint behind the hardcore gold'],
  ['offline', 'bg-offline', 'a Steam profile that is offline'],
  ['redump · tosec', 'bg-redump', 'the hash databases (-ink: the text)'],
  ['best-period', 'bg-best-period', 'the best-period purple (-soft: its chip)'],
  ['award-mastered', 'bg-award-mastered', 'RA awards: mastered, completed, beaten'],
  ['steam-button · -slate', 'bg-steam-button', 'Steam’s own sign-in button'],
  ['xbox-dark · psn-night', 'bg-xbox-dark', 'the platforms’ darker ends, for gradients'],
]
const CONSOLES: [string, string][] = [
  ['console-ps1', 'bg-console-ps1/40 text-console-ps1-ink'],
  ['console-ps2', 'bg-console-ps2/40 text-console-ps2-ink'],
  ['console-psp', 'bg-console-psp/40 text-console-psp-ink'],
  ['console-gb', 'bg-console-gb/40 text-console-gb-ink'],
  ['console-gbc', 'bg-console-gbc/40 text-console-gbc-ink'],
  ['console-gba', 'bg-console-gba/40 text-console-gba-ink'],
  ['console-nds', 'bg-console-nds/40 text-warning'],
  ['console-gamecube', 'bg-console-gamecube/40 text-console-gamecube-ink'],
  ['console-wii', 'bg-console-wii/40 text-console-wii-ink'],
  ['console-megadrive', 'bg-console-megadrive/40 text-console-megadrive-ink'],
  ['console-n64', 'bg-console-n64/40 text-hardcore'],
  ['console-snes', 'bg-console-snes/40 text-console-snes-ink'],
  ['console-dreamcast', 'bg-console-dreamcast/40 text-console-dreamcast-ink'],
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
          <div className="flex flex-wrap gap-4">{OTHER_HUES.map(([n, c, u]) => <Swatch key={n} name={n} cls={c} use={u} />)}</div>
          <div className="flex flex-wrap gap-4">
            {CONSOLES.map(([n, c]) => <Swatch key={n} name={n} cls={c} use="a console’s tint and ink" />)}
          </div>
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
          <Kicker tone="accent" size="md">Kicker, in sentence case</Kicker>
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

      <DesignCatalogPiece id="brand-mark">
        <Panel>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Specimen key={size} name={`size ${size}`}>
              <BrandMark name="CheevoVault" size={size} />
            </Specimen>
          ))}
          <Specimen name="size title, logo after (the landing)">
            <BrandMark name="CheevoVault" size="title" logoAfter className="text-[3rem]! sm:text-[4rem]!" />
          </Specimen>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="theme-screen">
        <Compare>
          <div className="grid grid-cols-2 gap-3">
            <ThemeScreen theme="dark" on />
            <ThemeScreen theme="light-black" />
            <ThemeScreen theme="sakura" />
            <ThemeScreen theme="venom" />
          </div>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="shape">
        <Compare>
          <Specimen name="Radii: chip, tag, button, tile, pane, field, card">
            {RADII.map((r) => <span key={r} aria-hidden="true" className={`h-12 w-16 bg-ink/15 ring-1 ring-ink/20 ${r}`} />)}
          </Specimen>
          <Specimen name="--slant: the one angle, on a plate (SLANT_PLATE)">
            <span aria-hidden="true" className={`${SLANT_PLATE} h-12 w-24 before:bg-accent`} />
          </Specimen>
          <Specimen name="--mark: the signature (MARK)">
            <span aria-hidden="true" className={`text-3xl font-extrabold leading-none text-accent ${MARK}`} />
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
