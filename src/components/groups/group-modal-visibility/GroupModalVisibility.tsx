import { useId } from 'react'
import { IconLock, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** Private or public, as two options that say who will see the group. */
export default function GroupModalVisibility({ isPublic, onChange }: { isPublic: boolean; onChange: (isPublic: boolean) => void }) {
  const { T } = useLanguage()
  const name = useId()
  const options = [
    { value: false, label: T.groups.private, hint: T.groups.privateHint, Icon: IconLock },
    { value: true, label: T.groups.public, hint: T.groups.publicHint, Icon: IconWorld },
  ]

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">{T.groups.visibilityLabel}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label, hint, Icon }) => {
          const checked = isPublic === value
          return (
            <label
              key={label}
              className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70 ${checked ? 'ring-accent bg-accent/10' : 'ring-ink/10 bg-bg-main hover:ring-ink/25'}`}
            >
              <input type="radio" name={name} checked={checked} onChange={() => onChange(value)} className="sr-only" />
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${checked ? 'text-accent' : 'text-text-secondary'}`} aria-hidden="true" />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-text-main">{label}</span>
                <span className="text-[11px] text-text-secondary leading-snug">{hint}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
