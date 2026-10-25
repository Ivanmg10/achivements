import DesignCatalogControls from './design-catalog-controls/DesignCatalogControls'
import DesignCatalogData from './design-catalog-data/DesignCatalogData'
import DesignCatalogFeedback from './design-catalog-feedback/DesignCatalogFeedback'
import DesignCatalogTokens from './design-catalog-tokens/DesignCatalogTokens'

const PARTS = [
  ['tokens', 'Tokens'], ['buttons', 'Buttons'], ['fields', 'Fields'], ['choosers', 'Choosers'],
  ['figures', 'Figures'], ['progress', 'Progress'], ['tiers', 'Tiers'], ['surfaces', 'Surfaces'], ['feedback', 'Feedback'],
] as const

/**
 * The design system's catalogue (admins only, `/design`): every piece of
 * `src/components/ui` live, with its variants, drawn with the same components
 * the pages use, so it cannot drift from the code. In English on purpose, like
 * the admin panel. How to use it: `docs/design-system.md`.
 */
export default function DesignCatalog() {
  return (
    <main className="px-3 sm:px-8 py-6 w-full mx-auto max-w-[96rem] flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <h1 className="font-display italic font-extrabold text-5xl sm:text-[4.5rem] leading-[0.9] pr-2">Design system</h1>
        <p className="max-w-3xl text-text-secondary">
          Every piece of <code>src/components/ui</code>, live. New screens are built from these; a missing piece is added here first, with its test.
          Flip the shape, the theme and the game-card style in Preferences to see every piece follow.
        </p>
        <nav aria-label="Parts" className="flex flex-wrap gap-2">
          {PARTS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="h-8 px-3 inline-flex items-center rounded-chip bg-ink/[0.06] hover:bg-ink/10 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {label}
            </a>
          ))}
        </nav>
      </header>
      <DesignCatalogTokens />
      <DesignCatalogControls />
      <DesignCatalogData />
      <DesignCatalogFeedback />
    </main>
  )
}
