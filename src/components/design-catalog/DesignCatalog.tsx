'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useShapeStyle, type ShapeStyle } from '@/hooks/useShapeStyle'
import { useGameCardStyle, type GameCardStyle } from '@/hooks/useGameCardStyle'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { SURFACE } from '@/components/ui/surface'
import { GROUPS } from './catalogue'
import DesignCatalogSidebar from './design-catalog-sidebar/DesignCatalogSidebar'
import DesignCatalogFoundations from './design-catalog-foundations/DesignCatalogFoundations'
import DesignCatalogControls from './design-catalog-controls/DesignCatalogControls'
import DesignCatalogData from './design-catalog-data/DesignCatalogData'
import DesignCatalogFeedback from './design-catalog-feedback/DesignCatalogFeedback'

const COUNT = GROUPS.reduce((n, g) => n + g.pieces.length, 0)

/**
 * The design system's catalogue (admins only, `/design`): every piece of
 * `src/components/ui` live, with its variants, in both designs side by side
 * where the shape matters, drawn with the same components the pages use, so it
 * cannot drift from the code. In English on purpose, like the admin panel. The
 * menu follows the reader; the card text comes from `catalogue.ts`. How to use
 * it: `docs/design-system.md`.
 */
export default function DesignCatalog() {
  const { T } = useLanguage()
  const [shape, setShape] = useShapeStyle()
  const [cards, setCards] = useGameCardStyle()

  return (
    <main className="px-3 sm:px-8 py-6 w-full mx-auto max-w-[96rem] flex flex-col gap-6">
      <header
        className="relative overflow-hidden rounded-card ring-1 ring-inset ring-ink/[0.06] p-6 sm:p-10 flex flex-col gap-5"
        style={{ background: 'radial-gradient(ellipse at top left, rgb(var(--accent) / 0.2), transparent 60%), rgb(var(--bg-card))' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">CheevoVault · {COUNT} pieces · admins only</p>
        <h1 className="font-display italic font-extrabold text-5xl sm:text-[5rem] leading-[0.9] pr-2">Design system</h1>
        <p className="max-w-3xl text-base sm:text-lg text-text-main/85 leading-relaxed">
          Every piece of <code>src/components/ui</code>, live. New screens are built from these; a missing piece is added here first, with its test.
          Where the shape matters, each piece is drawn twice: slanted, and round.
        </p>
        <div className={`${SURFACE} self-start p-3 flex flex-wrap items-center gap-x-6 gap-y-3 bg-black/20`}>
          <span className="text-[0.8125rem] text-text-secondary">Your site</span>
          <SegmentedControl<ShapeStyle> aria-label={T.homeLayout.shapeLabel} size="xs" value={shape} onChange={setShape} options={[{ value: 'slanted', label: T.homeLayout.shapeSlanted }, { value: 'round', label: T.homeLayout.shapeRound }]} />
          <SegmentedControl<GameCardStyle> aria-label={T.homeLayout.cardsLabel} size="xs" value={cards} onChange={setCards} options={[{ value: 'tinted', label: T.homeLayout.cardsTinted }, { value: 'flat', label: T.homeLayout.cardsFlat }]} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
        <DesignCatalogSidebar />
        <div className="flex flex-col gap-10 min-w-0">
          <GroupHead id="foundations" />
          <DesignCatalogFoundations />
          <GroupHead id="controls" />
          <DesignCatalogControls />
          <GroupHead id="data" />
          <DesignCatalogData />
          <GroupHead id="feedback" />
          <DesignCatalogFeedback />
        </div>
      </div>
    </main>
  )
}

/** A group's title between its pieces. */
function GroupHead({ id }: { id: string }) {
  const group = GROUPS.find((g) => g.id === id)!
  return <h2 className="-mb-4 font-display italic font-extrabold text-4xl leading-none pr-2 scroll-mt-24" id={`group-${id}`}>{group.title}</h2>
}
