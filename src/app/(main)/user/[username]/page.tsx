import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { profileTeaser } from '@/lib/rankings'
import { SITE_NAME } from '@/lib/siteUrl'
import { levelOf } from '@/utils/vaultLevel'
import PublicUserPage from '@/components/public-user-page/PublicUserPage'
import ProfileTeaser from '@/components/profile-teaser/ProfileTeaser'
import PublicShell from '@/components/public-shell/PublicShell'

interface Props {
  params: Promise<{ username: string }>
}

// The metadata and the page ask for the same row in one request.
const teaserFor = cache(profileTeaser)

/** A shared link's title and description; nothing for anyone not in the rankings. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const teaser = await teaserFor(decodeURIComponent(username)).catch((err) => {
    console.error('[profile metadata]', err)
    return null
  })
  if (!teaser) return {}
  const title = `${teaser.username} · ${SITE_NAME}`
  const description = `Level ${levelOf(teaser.points)} · ${teaser.points.toLocaleString('en')} Vault Points. RetroAchievements, Steam and PlayStation achievements in one place.`
  return {
    title: teaser.username,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

/** Signed in, the whole profile; signed out, only what the rankings show of them (or a 404). */
export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const name = decodeURIComponent(username)
  if (await getServerSession(authOptions)) return <PublicUserPage username={name} />

  const teaser = await teaserFor(name)
  if (!teaser) notFound()
  return (
    <PublicShell current={`/user/${username}`}>
      <ProfileTeaser teaser={teaser} />
    </PublicShell>
  )
}
