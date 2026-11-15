import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'

/**
 * A window onto the art wall (the sliding game covers of the sign-in page): the
 * band over the name on a phone's sign-in. The
 * edges fade into the page so it reads as a picture, not a box. `className` is
 * for its size and corners.
 */
export default function CoverBand({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden ring-1 ring-ink/10 bg-bg-card pointer-events-none select-none ${className}`}>
      <AuthCollagePanel />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(var(--bg-main)/0.85))]" />
    </div>
  )
}
