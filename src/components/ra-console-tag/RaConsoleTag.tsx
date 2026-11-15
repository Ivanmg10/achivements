import Image from 'next/image'
import { CONSOLES } from '@/constants'
import Tag from '@/components/ui/Tag'

type ConsoleDef = (typeof CONSOLES)[number]

/** An RA console's chip in its own colours, with its icon; a console the table does not know is a plain chip. */
export default function RaConsoleTag({ console: def, name }: { console?: ConsoleDef; name: string }) {
  return (
    <Tag size="xs" tone="custom" className={def?.color ?? 'bg-bg-main text-text-secondary'}>
      {def?.icon && <Image src={def.icon} alt="" width={12} height={12} className="w-3 h-3 object-contain shrink-0" />}
      {name}
    </Tag>
  )
}
