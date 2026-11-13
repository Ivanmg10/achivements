'use client'

import AccordionItem from '@/components/ui/Accordion'
import type { FaqItem } from '@/translations/seoPages'

/** One question of a FAQ: the library's accordion. */
export default function FaqListItem({ item }: { item: FaqItem }) {
  return (
    <AccordionItem title={item.q}>
      <p>{item.a}</p>
    </AccordionItem>
  )
}
