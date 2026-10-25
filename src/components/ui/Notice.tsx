import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react'

type Tone = 'danger' | 'success' | 'warning' | 'info'

const TONES: Record<Tone, { box: string; icon: typeof IconInfoCircle }> = {
  danger: { box: 'bg-danger/10 ring-danger/30 text-danger', icon: IconAlertCircle },
  success: { box: 'bg-success/10 ring-success/30 text-success', icon: IconCircleCheck },
  warning: { box: 'bg-warning/10 ring-warning/30 text-warning', icon: IconAlertTriangle },
  info: { box: 'bg-info/10 ring-info/30 text-info', icon: IconInfoCircle },
}

/**
 * An inline notice: tinted in the theme's colour for what it says, with its
 * icon (never colour alone). An error is announced (`role="alert"`), the rest
 * politely (`role="status"`). For an error next to one field, use Field's error.
 */
export default function Notice({
  tone = 'info',
  title,
  children,
  action,
  className = '',
}: {
  tone?: Tone
  /** A bold first line. */
  title?: React.ReactNode
  children?: React.ReactNode
  /** A button or link on the right. */
  action?: React.ReactNode
  /** Layout only. */
  className?: string
}) {
  const { box, icon: Icon } = TONES[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-control px-3.5 py-2.5 text-sm ring-1 ring-inset ${box} ${className}`}>
      <Icon size={17} aria-hidden="true" className="shrink-0 mt-px" />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'text-text-main/85' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}
