import type { FaqItem } from '@/translations/seoPages'
import FaqListItem from '@/components/faq-list/faq-list-item/FaqListItem'

/** Questions that open in place, under their title: a page's narrow column (the comparisons, the rankings guide). */
export default function FaqList({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <section className="grid gap-6">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 enter-rows">
        {items.map((item) => (
          <FaqListItem key={item.q} item={item} />
        ))}
      </div>
    </section>
  )
}
