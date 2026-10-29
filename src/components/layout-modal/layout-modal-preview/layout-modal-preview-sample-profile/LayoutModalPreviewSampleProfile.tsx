'use client'

import { useLanguage } from '@/context/LanguageContext'
import { StatPill } from '@/components/ui/StatPill'

/** The fixed profile card beside the sample home's recent games. */
export default function LayoutModalPreviewSampleProfile() {
  const { T, lang } = useLanguage()
  return (
    <aside className="rounded-card bg-bg-card p-3 ring-1 ring-ink/[0.08]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-12 w-12 rounded-full bg-accent/25 ring-1 ring-inset ring-accent/40" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-main">CheevoVault</p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">LV 27</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatPill size="sm" label="VP" value={(1280).toLocaleString(lang)} />
        <StatPill size="sm" label={T.sidePanel.streak} value={12} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <span className="h-2 rounded-sm bg-ink/10" />
        <span className="h-2 w-2/3 rounded-sm bg-ink/10" />
      </div>
    </aside>
  )
}
