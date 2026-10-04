import { IconBookmark, IconDeviceGamepad2, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import EmptyState from '@/components/empty-state/EmptyState'

/** A status list with nothing in it: what the list is for, and how it fills up. */
export default function StatusEmptyState({ category, className }: { category: string; className?: string }) {
  const { T } = useLanguage()
  const byCategory: Record<string, { Icon: typeof IconTrophy; title: string; sub: string }> = {
    wantToPlay: { Icon: IconBookmark, title: T.categoryPage.noWantToPlay, sub: T.categoryPage.noWantToPlaySub },
    playing: { Icon: IconDeviceGamepad2, title: T.categoryPage.noPlaying, sub: T.categoryPage.noPlayingSub },
    completed: { Icon: IconTrophy, title: T.categoryPage.noCompleted, sub: T.categoryPage.noCompletedSub },
  }
  const { Icon, title, sub } = byCategory[category] ?? byCategory.playing
  return <EmptyState icon={<Icon className="w-7 h-7" />} title={title} subtitle={sub} className={className} />
}
