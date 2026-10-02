'use client'

import { useLanguage } from '@/context/LanguageContext'
import LegalDocument from '@/components/legal-document/LegalDocument'

/** The rules for using the site, and what can happen to an account that breaks them. */
export default function TermsOfUse() {
  const { T } = useLanguage()
  return <LegalDocument doc={T.terms} />
}
