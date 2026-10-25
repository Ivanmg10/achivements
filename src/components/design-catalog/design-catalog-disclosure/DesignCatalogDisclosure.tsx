'use client'

import { useState } from 'react'
import { IconBookmark, IconBookmarkFilled, IconStar, IconStarFilled } from '@tabler/icons-react'
import AccordionItem from '@/components/ui/Accordion'
import ShowMore from '@/components/ui/ShowMore'
import ToggleButton from '@/components/ui/ToggleButton'
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
          </div>
        </Panel>
      </DesignCatalogPiece>
      <DesignCatalogPiece id="show-more"><Compare><ShowMoreDemo /></Compare></DesignCatalogPiece>
      <DesignCatalogPiece id="toggle-button"><Panel><ToggleDemo /></Panel></DesignCatalogPiece>
    </>
  )
}
