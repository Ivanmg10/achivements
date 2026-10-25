import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { loadUser } from '@/lib/userRecord'
import DesignCatalog from '@/components/design-catalog/DesignCatalog'

export const metadata: Metadata = { title: 'Design system', robots: { index: false, follow: false } }

/**
 * The design system's catalogue: every piece of `src/components/ui` drawn live
 * with its variants, and the design's tokens. For admins only: the flag is read
 * from the database (never the session), and anyone else gets the site's 404,
 * as if the page did not exist. Signed out never gets here (the proxy asks to sign in).
 */
export default async function DesignPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user?.id ? await loadUser(session.user.id, { fresh: true }) : null
  if (!user?.admin) notFound()
  return <DesignCatalog />
}
