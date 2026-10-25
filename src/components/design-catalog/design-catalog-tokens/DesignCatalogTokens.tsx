import DesignCatalogSection, { Specimen } from '../design-catalog-section/DesignCatalogSection'
import { slantStyle } from '@/components/ui/shape'

const COLOURS = ['bg-bg-main', 'bg-bg-card', 'bg-bg-header', 'bg-accent', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-hardcore', 'bg-softcore', 'bg-ink/20']
const RADII = ['rounded-chip', 'rounded-control', 'rounded-field', 'rounded-card']

/** The design's tokens in use: colours of the theme, radii, and the shape of a bar (slanted or round, per the person's choice). */
export default function DesignCatalogTokens() {
  return (
    <DesignCatalogSection id="tokens" title="Tokens" hint="Defined once in globals.css; a theme changes the colours, the design (slanted or round) changes the shapes. Components read them, never a fixed value. Use Preferences → General to flip the shape and see every piece follow.">
      <div className="flex flex-wrap gap-2">
        {COLOURS.map((c) => (
          <Specimen key={c} name={c.replace('bg-', '')}>
            <span aria-hidden="true" className={`w-14 h-9 rounded-control ring-1 ring-ink/15 ${c}`} />
          </Specimen>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {RADII.map((r) => (
          <Specimen key={r} name={r}>
            <span aria-hidden="true" className={`w-16 h-12 bg-ink/15 ring-1 ring-ink/20 ${r}`} />
          </Specimen>
        ))}
        <Specimen name="slantStyle(8) · --clip-8, --bar-radius">
          <span aria-hidden="true" className="w-40 h-3 bg-accent" style={slantStyle(8)} />
        </Specimen>
      </div>
    </DesignCatalogSection>
  )
}
