'use client'

import { IconLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'

/** Copies the profile's address (without its tab) so it can be passed on; a toast says how it went. */
export default function PublicUserShareButton() {
  const { T } = useLanguage()

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0])
      notify.success(T.toast.profileLinkCopied)
    } catch (err) {
      console.error('[PublicUserShareButton]', err)
      notify.error(T.toast.profileLinkFailed)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-tile bg-bg-main text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <IconLink size={13} aria-hidden="true" />
      {T.userProfile.copyLink}
    </button>
  )
}
