import { notFound } from 'next/navigation'

const CATEGORIES = ['wantToPlay', 'playing', 'completed']

/**
 * [category] would otherwise catch any one-segment URL (/robots.txt, /foo)
 * and answer 200 with an empty list. Anything that is not a real category
 * gets a 404 instead.
 */
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!CATEGORIES.includes(category)) notFound()
  return <>{children}</>
}
