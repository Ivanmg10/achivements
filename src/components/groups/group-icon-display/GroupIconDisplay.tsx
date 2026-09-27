import Image from 'next/image'

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

/** Sits beside the group's name, which already says what it is: decorative. */
export default function GroupIconDisplay({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-4xl leading-none" aria-hidden="true">📁</span>
  if (isImageUrl(icon)) {
    return (
      <Image
        src={icon}
        alt=""
        width={56}
        height={56}
        className="w-14 h-14 rounded-xl object-cover"
        unoptimized
      />
    )
  }
  return <span className="text-4xl leading-none" aria-hidden="true">{icon}</span>
}
