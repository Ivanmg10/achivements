'use client'

import { useId } from 'react'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHomeLayout, type HomeLayout } from '@/hooks/useHomeLayout'
import SegmentedControl from '@/components/ui/SegmentedControl'

/** How the home looks: classic (the default) or with the game played last in big on top. */
export default function UserHomeLayoutPreference() {
  const { T } = useLanguage()
  const [layout, setLayout] = useHomeLayout()
  const labelId = useId()

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 -mx-1 py-1.5">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
        <IconLayoutDashboard size={18} />
      </span>
      <span id={labelId} className="flex-1 min-w-0 text-xs text-text-secondary">{T.homeLayout.label}</span>
      <SegmentedControl<HomeLayout>
        aria-label={T.homeLayout.label}
        size="xs"
        value={layout}
        onChange={setLayout}
        options={[
          { value: 'classic', label: T.homeLayout.classic },
          { value: 'cover', label: T.homeLayout.cover },
        ]}
      />
    </div>
  )
}
