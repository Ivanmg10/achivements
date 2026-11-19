import LibraryPage from '@/components/library-page/LibraryPage'
import { isGameSource } from '@/utils/gameRef'

type Props = { searchParams: Promise<{ platform?: string | string[] }> }

/**
 * Every game of every platform: the library page with "all" as one more status (#129, MejTodosRework).
 * `?platform=psn` opens it on that platform's tab (the home's console tiles link here, #164); read on the
 * server, as the sign-in page does, so the page is not left to the browser's JavaScript.
 */
export default async function AllGamesPage({ searchParams }: Props) {
  const { platform } = await searchParams
  return <LibraryPage category="all" initialPlatform={isGameSource(platform) ? platform : 'all'} />
}
