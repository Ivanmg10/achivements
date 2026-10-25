'use client'

import AccordionItem from '@/components/ui/Accordion'
import type { FaqItem } from '@/translations/seoPages'

/** One question of a FAQ: the library's accordion, numbered by its place in the list. */
export default function FaqListItem({ item, index }: { item: FaqItem; index: number }) {
  return (
    <AccordionItem title={item.q} index={index}>
      <p>{item.a}</p>
    </AccordionItem>
  )
}
