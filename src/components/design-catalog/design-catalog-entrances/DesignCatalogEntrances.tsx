'use client'

import { useState } from 'react'
import { CountUp } from '@/components/ui/CountUp'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SURFACE } from '@/components/ui/surface'
import Button from '@/components/ui/Button'
import { Specimen } from '../design-catalog-piece/DesignCatalogPiece'

const ROWS = ['First row', 'Second row', 'Third row']

/** The entrance families on real pieces; "Play again" mounts them anew, as a page does. */
export default function DesignCatalogEntrances() {
  const [run, setRun] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setRun((n) => n + 1)}>
        Play again
      </Button>
      <div key={run} className="flex flex-wrap gap-4">
        <Specimen name=".enter-rows on a hero or a list">
          <div className="w-44 flex flex-col gap-1.5 enter-rows">
            <h3 className="font-display italic font-extrabold text-2xl leading-none pr-1">Title first</h3>
            {ROWS.map((row) => <p key={row} className="text-sm text-text-secondary">{row}</p>)}
          </div>
        </Specimen>
        <Specimen name=".enter-cards">
          <div className="flex gap-2 enter-cards">
            {ROWS.map((row) => <span key={row} aria-hidden="true" className={`${SURFACE} w-14 h-20`} />)}
          </div>
        </Specimen>
        <Specimen name="Figures: a bar, a step, a number">
          <div className="w-44 flex flex-col gap-3 enter-rise">
            <ProgressBar pct={68} label="68 %" />
            <span aria-hidden="true" className="h-10 w-8 bg-accent enter-grow-y" />
            <CountUp value={1280} className="text-2xl font-extrabold" />
          </div>
        </Specimen>
      </div>
    </div>
  )
}
