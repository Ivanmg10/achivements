import { CONSOLES } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'

export default function ConsoleSideList({ slug }: { slug: string }) {
  return (
    <div className="flex flex-row flex-wrap justify-end gap-x-3 gap-y-1">
      {CONSOLES.map((console) => (
        <Link
          key={console.id}
          href={`/${slug}/${console.id}`}
          className="flex items-center gap-1 hover:opacity-100 opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
          title={console.name}
        >
          <Image
            src={console.icon}
            alt={console.name}
            width={16}
            height={16}
            className="object-contain shrink-0"
          />
          <span className="text-xs text-text-secondary whitespace-nowrap hidden sm:inline">{console.name}</span>
        </Link>
      ))}
    </div>
  )
}
