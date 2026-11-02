import type { FaqItem } from '@/translations/seoPages'
import FaqListItem from '@/components/faq-list/faq-list-item/FaqListItem'

/**
 * Questions that open in place. `split` puts the title beside the list on wide
 * screens (the landing); otherwise it sits above it (a page's narrow column).
 */
export default function FaqList({ title, lead, items, split = false }: { title: string; lead?: string; items: FaqItem[]; split?: boolean }) {
  return (
    <section className={`grid gap-6 ${split ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12' : ''}`}>
      <div className={`flex flex-col gap-2 ${split ? 'lg:sticky lg:top-24 lg:self-start' : ''}`}>
        <h2 className={`font-bold tracking-tight ${split ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>{title}</h2>
        {lead && <p className="text-sm sm:text-base text-text-secondary max-w-sm">{lead}</p>}
      </div>
      <div className="flex flex-col gap-3 enter-rows">
        {items.map((item, i) => (
          <FaqListItem key={item.q} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
