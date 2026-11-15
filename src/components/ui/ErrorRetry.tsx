import Notice from './Notice'
import Button from './Button'

/**
 * A read that failed and can be asked again: a danger `Notice` (announced)
 * with what failed, an optional hint (a private profile and how to fix it) and
 * a quiet retry button.
 */
export default function ErrorRetry({
  message,
  hint,
  retryLabel,
  onRetry,
  className = '',
}: {
  message: string
  hint?: string
  retryLabel: string
  onRetry: () => void
  /** Layout only. */
  className?: string
}) {
  return (
    <Notice
      tone="danger"
      title={hint ? message : undefined}
      action={<Button variant="quiet" size="sm" onClick={onRetry}>{retryLabel}</Button>}
      className={className}
    >
      {hint ?? message}
    </Notice>
  )
}
