import type { Metadata } from 'next'
import PrivacyPolicy from '@/components/privacy-policy/PrivacyPolicy'

export const metadata: Metadata = {
  title: 'Privacy & cookies',
  alternates: { canonical: '/privacy' },
}

/** Open to everyone: the cookie banner links here before anyone has an account. */
export default function PrivacyPage() {
  return <PrivacyPolicy />
}
