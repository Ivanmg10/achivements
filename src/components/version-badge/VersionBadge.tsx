import { APP_VERSION } from '@/lib/version'

export default function VersionBadge() {
  return (
    <span className="fixed bottom-3 right-3 text-[11px] text-white/20 select-none pointer-events-none blur-[0.4px] z-50">
      v{APP_VERSION}
    </span>
  )
}
