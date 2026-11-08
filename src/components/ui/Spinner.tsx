const SIZES = { sm: 'w-3 h-3 border-[1.5px]', md: 'w-4 h-4 border-2' }

/**
 * A spinner in the colour of the text around it, for an action on its way
 * (inside a button: `Button loading` draws it). Never for content loading:
 * that is a skeleton. Still under reduced motion. Decorative: the button's
 * words say what is happening.
 */
export default function Spinner({ size = 'md', className = '' }: { size?: keyof typeof SIZES; className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 rounded-full border-current border-r-transparent animate-spin motion-reduce:animate-none ${SIZES[size]} ${className}`} />
}
