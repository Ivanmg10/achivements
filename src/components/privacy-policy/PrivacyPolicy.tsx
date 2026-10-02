'use client'

import { useLanguage } from '@/context/LanguageContext'
import LegalDocument from '@/components/legal-document/LegalDocument'

/** What the site keeps about people, why, and what they can do about it. */
export default function PrivacyPolicy() {
  const { T } = useLanguage()
  return <LegalDocument doc={T.privacy} />
}
