import { CONSOLES } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'

export default function ConsoleSideList({ slug }: { slug: string }) {
  return (
    <div className="flex flex-row gap-3 overflow-hidden shrink-0">
      {CONSOLES.map((console) => (
        <Link
          key={console.id}
          href={`/${slug}/${console.id}`}
          className="flex items-center gap-1 hover:opacity-100 opacity-50 transition-opacity shrink-0"
          title={console.name}
        >
          <Image
            src={console.icon}
            alt={console.name}
            width={16}
            height={16}
            className="object-contain"
          />
          <span className="text-xs text-text-secondary whitespace-nowrap">{console.name}</span>
        </Link>
      ))}
    </div>
  )
}
