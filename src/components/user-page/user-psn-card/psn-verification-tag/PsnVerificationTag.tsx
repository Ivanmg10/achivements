'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import Tag from '@/components/ui/Tag'

/** Whether the linked PlayStation account is proven to be yours (#176), in words; nothing while none is linked. */
export default function PsnVerificationTag() {
  const { T } = useLanguage()
  const V = T.psn.verification
  const { linked, verified } = usePsnVerification({ active: false })
  if (!linked) return null
  return <Tag tone={verified ? 'success' : 'warning'}>{verified ? V.verified : V.unverified}</Tag>
}
