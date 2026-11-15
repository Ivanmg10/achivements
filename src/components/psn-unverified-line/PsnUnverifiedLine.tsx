'use client'

import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

/**
 * Where Vault Points show for someone whose PlayStation account is not verified: its trophies are not in them
 * (#176). With `action` it is a notice that leads to the account page, where the code is; without it, a line
 * of text, for a card that is itself a link.
 */
export default function PsnUnverifiedLine({ action = false, className = '' }: { action?: boolean; className?: string }) {
  const { T } = useLanguage()
  const { vaultLine, vaultAction } = T.psn.verification

  if (!action) return <span className={`text-xs text-text-secondary ${className}`}>{vaultLine}</span>
  return (
    <Notice
      size="sm"
      className={className}
      action={<Button href="/user" size="sm" variant="secondary">{vaultAction}</Button>}
    >
      {vaultLine}
    </Notice>
  )
}
