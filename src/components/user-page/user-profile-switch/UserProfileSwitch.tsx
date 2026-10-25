'use client'

import { useId, type ReactNode } from 'react'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import Switch from '@/components/ui/Switch'

/**
 * An on/off profile setting (public profile, gender on it…), saved on the
 * spot: the state is written out ("Only you can see it"), not just coloured.
 */
export default function UserProfileSwitch({
  field,
  checked,
  label,
  onText,
  offText,
  icon,
  onSaved,
}: {
  /** The profile field it saves, as "true" or "false". */
  field: string
  checked: boolean
  label: string
  onText: string
  offText: string
  icon: ReactNode
  /** For a setting the session does not carry: told the value once it is saved. */
  onSaved?: (value: boolean) => void
}) {
  const { save, saving, error } = useSaveProfileField()
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3.5 rounded-xl px-1 -mx-1 py-1.5">
        <span aria-hidden="true" className="w-9 h-9 shrink-0 flex items-center justify-center text-text-secondary">
          {icon}
        </span>
        <span className="flex flex-col min-w-0 flex-1">
          <span id={labelId} className="text-[0.9375rem] font-bold">{label}</span>
          <span className="text-[0.8125rem] text-text-secondary">{checked ? onText : offText}</span>
        </span>
        <Switch
          checked={checked}
          aria-labelledby={labelId}
          disabled={saving}
          onChange={async (next) => {
            if (await save(field, String(next))) onSaved?.(next)
          }}
        />
      </div>
      {error && <p role="alert" className="text-xs text-danger px-2">{error}</p>}
    </div>
  )
}
