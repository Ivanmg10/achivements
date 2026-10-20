import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import NotFoundScreen from '@/components/not-found-screen/NotFoundScreen'
import NotFoundInApp from '@/components/not-found-in-app/NotFoundInApp'

/**
 * A notFound() inside the app, and (as Next resolves it) most URLs that match
 * nothing. Signed in, it is shown under the header; signed out the layout adds
 * nothing (see layout.tsx), so it takes the whole screen like the root 404.
 */
export default async function MainNotFound() {
  const session = await getServerSession(authOptions)
  return session ? <NotFoundInApp /> : <NotFoundScreen fullScreen />
}
