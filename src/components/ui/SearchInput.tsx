import { IconSearch } from '@tabler/icons-react'
import Input from './Input'

type Props = Omit<React.ComponentProps<typeof Input>, 'icon' | 'type'> & {
  /** Required: a search field has no visible label. */
  'aria-label': string
  /** Layout only, on the wrapper. */
  className?: string
}

/** A search field: the library's field with a magnifier inside. */
export default function SearchInput({ className = '', size = 'sm', ...rest }: Props) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
      <Input type="search" icon size={size} {...rest} />
    </div>
  )
}
