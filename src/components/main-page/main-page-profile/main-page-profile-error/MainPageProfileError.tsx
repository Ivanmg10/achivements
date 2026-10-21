import { IconCloudOff, IconRefresh } from '@tabler/icons-react'
import StatusBadge from '@/components/status-badge/StatusBadge'
import { STATUS_BUTTON } from '@/components/status-badge/statusScreen'

/**
 * A platform's profile that could not be read, in the place of the profile:
 * the error screens' badge with the platform's logo on its corner, what
 * happened and why (when the platform says), and a way to ask again. Fills the
 * column like the profile would, so switching tabs does not resize it.
 */
export default function MainPageProfileError({
  logo,
  title,
  detail,
  retryLabel,
  onRetry,
}: {
  logo: React.ReactNode
  title: string
  detail?: string
  retryLabel: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center px-6 py-10 bg-bg-card rounded-xl w-full h-full">
      <StatusBadge tone="danger" icon={<IconCloudOff size={40} stroke={1.75} />} corner={logo} />
      <div role="alert" className="flex flex-col items-center gap-1.5">
        <p className="text-base font-semibold text-text-main text-balance">{title}</p>
        {detail && <p className="text-sm text-text-secondary max-w-xs">{detail}</p>}
      </div>
      <button type="button" onClick={onRetry} className={STATUS_BUTTON.secondary}>
        <IconRefresh size={18} aria-hidden="true" />
        {retryLabel}
      </button>
    </div>
  )
}
