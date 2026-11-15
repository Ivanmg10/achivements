'use client'

import { IconLock, IconTrophy, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Why a PlayStation account is verified (#176), under the code in its dialog: anyone could link any public
 * profile, so only a proven one adds Vault Points (one user per account), and what is read to prove it.
 */
export default function PsnVerificationWhy() {
  const { T } = useLanguage()
  const V = T.psn.verification
  const points = [
    { icon: IconUsers, text: V.whyAnyone },
    { icon: IconTrophy, text: V.whyCounts },
    { icon: IconLock, text: V.whyPrivacy },
  ]

  return (
    <section aria-labelledby="psn-verification-why" className="flex flex-col gap-2.5 pt-4 mt-1 shadow-hairline-t">
      <h3 id="psn-verification-why" className="text-sm font-semibold">{V.whyTitle}</h3>
      <ul className="flex flex-col gap-2.5">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-2.5 text-[0.8125rem] text-text-secondary leading-snug">
            <Icon size={16} aria-hidden="true" className="shrink-0 mt-0.5 text-text-main" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
