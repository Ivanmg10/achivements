import Image from 'next/image'

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

export default function GroupIconDisplay({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-4xl leading-none">📁</span>
  if (isImageUrl(icon)) {
    return (
      <Image
        src={icon}
        alt="icon"
        width={56}
        height={56}
        className="w-14 h-14 rounded-xl object-cover"
        unoptimized
      />
    )
  }
  return <span className="text-4xl leading-none">{icon}</span>
}
