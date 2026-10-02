import type { Metadata } from 'next'
import TermsOfUse from '@/components/terms-of-use/TermsOfUse'

export const metadata: Metadata = {
  title: 'Terms of use',
  alternates: { canonical: '/terms' },
}

/** Open to everyone: the sign-up form links here before anyone has an account. */
export default function TermsPage() {
  return <TermsOfUse />
}
