import Image from 'next/image'
import { IconFolder } from '@tabler/icons-react'
import { GameGroup } from '@/types/types'

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

export default function GroupIcon({ group }: { group: GameGroup }) {
  const icon = group.icon
  if (icon) {
    if (isImageUrl(icon)) {
      return (
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-bg-main">
          <Image src={icon} alt={group.title} width={56} height={56} className="w-full h-full object-cover" unoptimized />
        </div>
      )
    }
    return (
      <div className="w-14 h-14 rounded-xl bg-bg-main flex items-center justify-center shrink-0 text-3xl leading-none">
        {icon}
      </div>
    )
  }
  return (
    <div className="w-14 h-14 rounded-xl bg-bg-main flex items-center justify-center shrink-0">
      <IconFolder className="w-7 h-7 text-text-secondary" aria-hidden />
    </div>
  )
}
