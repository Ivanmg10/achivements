'use client'

import { useState } from 'react'
import { IconBookmark, IconBookmarkFilled, IconPlus, IconStar, IconStarFilled, IconTrophy } from '@tabler/icons-react'
import AccordionItem from '@/components/ui/Accordion'
import ShowMore from '@/components/ui/ShowMore'
import FoldList, { foldItem } from '@/components/ui/FoldList'
import ToggleButton from '@/components/ui/ToggleButton'
import Shelf from '@/components/ui/Shelf'
import SectionHead from '@/components/ui/SectionHead'
import DropSlot from '@/components/ui/DropSlot'
import GhostIcon from '@/components/ui/GhostIcon'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'

function ShowMoreDemo() {
  const [open, setOpen] = useState(false)
  const [small, setSmall] = useState(true)
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ShowMore expanded={open} onToggle={() => setOpen((v) => !v)} more="Show the other 31" less="Show fewer" />
      <ShowMore size="sm" expanded={small} onToggle={() => setSmall((v) => !v)} more="Show all 87" less="Show fewer" />
    </div>
  )
}

const FOLD_ROWS = ['Win a race', 'Finish the story', 'Collect every coin', 'Beat the boss on hard', 'Find the secret room', 'Never get hit', 'Max out a car']

function FoldListDemo() {
  const [folded, setFolded] = useState(true)
  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <FoldList folded={folded} onToggle={() => setFolded((f) => !f)} hasMore more="Show the other 4" less="Show fewer">
        <ul className="flex flex-col gap-2">
          {(folded ? FOLD_ROWS.slice(0, 3) : FOLD_ROWS).map((r, i) => (
            <li key={r} {...foldItem(i, 3)} className="rounded-tile bg-bg-card px-4 py-3 text-sm">{r}</li>
          ))}
        </ul>
      </FoldList>
    </div>
  )
}

function ToggleDemo() {
  const [star, setStar] = useState(true)
  const [mark, setMark] = useState(false)
  return (
    <Specimen name="icon / pressedIcon">
      <ToggleButton pressed={star} onToggle={() => setStar((v) => !v)} label="Pin it" icon={IconStar} pressedIcon={IconStarFilled} size={20} />
      <ToggleButton pressed={mark} onToggle={() => setMark((v) => !v)} label="Save it" icon={IconBookmark} pressedIcon={IconBookmarkFilled} size={20} />
    </Specimen>
  )
}

function DropSlotDemo() {
  const [added, setAdded] = useState(false)
  return (
    <DropSlot label="Add games" onClick={() => setAdded((v) => !v)} className="min-h-32 flex-col">
      <IconPlus className="w-6 h-6 text-accent" aria-hidden="true" />
      <span className="font-bold">{added ? 'Game added' : 'Add games'}</span>
    </DropSlot>
  )
}

/** What opens and closes: questions, "show more", and the on/off icon. */
export default function DesignCatalogDisclosure() {
  return (
    <>
      <DesignCatalogPiece id="accordion">
        <Panel>
          <div className="flex flex-col gap-3">
            <AccordionItem title="What are Vault Points?" index={0} defaultOpen>One score worth the same on every platform: it counts how hard and how rare each achievement is.</AccordionItem>
            <AccordionItem title="Who sees my profile?" index={1}>Anyone, while it is public; only you, otherwise.</AccordionItem>
            <AccordionItem title="Without a number">An accordion with no place in a list draws no number.</AccordionItem>
            <AccordionItem tone="danger" title={<><strong className="text-danger">2 achievements can be missed</strong> if you move on without them</>}>The danger tone folds a warning away: a game&apos;s missables.</AccordionItem>
          </div>
        </Panel>
      </DesignCatalogPiece>
      <DesignCatalogPiece id="show-more"><Compare><ShowMoreDemo /></Compare></DesignCatalogPiece>
      <DesignCatalogPiece id="fold-list"><Panel><FoldListDemo /></Panel></DesignCatalogPiece>
      <DesignCatalogPiece id="toggle-button"><Panel><ToggleDemo /></Panel></DesignCatalogPiece>
      <DesignCatalogPiece id="section-head">
        <Panel>
          <SectionHead title="Keep playing" hint="The games with something left" aside="12 games" />
          <SectionHead size="lg" as="h3" title="Best streaks" aside="5 streaks · 8 days on average" />
        </Panel>
      </DesignCatalogPiece>
      <DesignCatalogPiece id="shelf">
        <Panel>
          <Shelf title="Keep playing" hint="The games with something left">
            <div className="grid grid-cols-2 gap-3"><div className="rounded-tile bg-bg-card p-5">A game card</div><div className="rounded-tile bg-bg-card p-5">Another game</div></div>
          </Shelf>
        </Panel>
      </DesignCatalogPiece>
      <DesignCatalogPiece id="drop-slot">
        <Compare><DropSlotDemo /></Compare>
      </DesignCatalogPiece>
      <DesignCatalogPiece id="ghost-icon">
        <Panel>
          <div className="relative overflow-hidden rounded-card bg-bg-card p-7 min-h-40">
            <GhostIcon icon={IconTrophy} />
            <p className="font-display italic font-extrabold text-5xl leading-[0.9]">Rankings</p>
          </div>
        </Panel>
      </DesignCatalogPiece>
    </>
  )
}
