import type { Metadata } from 'next'
import WelcomePage from '@/components/welcome-page/WelcomePage'

export const metadata: Metadata = {
  title: 'Welcome',
  robots: { index: false },
}

/**
 * Where a new account lands after signing up (signed-in only, by the proxy).
 * Outside the (main) group on purpose: the app's header comes after the welcome.
 */
export default function Welcome() {
  return <WelcomePage />
}
