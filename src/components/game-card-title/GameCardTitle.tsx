import Link from 'next/link'

/** A game card's title, a link to the game that sits above the card's stretched expand button. */
export default function GameCardTitle({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="relative z-10 self-start max-w-full min-w-0 hover:underline decoration-ink/50 underline-offset-2 rounded focus-ring"
    >
      <p title={title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">{title}</p>
    </Link>
  )
}
