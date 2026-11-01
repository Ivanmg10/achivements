import { useLanguage } from '@/context/LanguageContext'
import { homeFit } from '@/lib/homeFit'
import { Skeleton } from '@/components/ui/Skeleton'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from '../../main-page-charts/MainPageHeatmap'
import MainPageProfileSkeleton from '../../main-page-profile/main-page-profile-skeleton/MainPageProfileSkeleton'
import MainPagePortadaSkeleton, { PortadaSideSkeleton } from '../../main-page-portada-skeleton/MainPagePortadaSkeleton'

const ROWS = 6
const PINS = 4
const STATS = 6
const SECTIONS = 7
const NO_ACHIEVEMENTS: never[] = []

/**
 * One layout of the home, empty, on the same boxes and `home-fit` classes as
 * the page. Each layout is its own `home-fit` box, because the page's rules ask
 * whether that box holds a `.home-cover`. The profile's platform switch shows
 * by `data-session` on <html>. `label` names the profile's skeleton. The two
 * charts are the real ones in their loading state: a skeleton of its own here
 * would show first, and then be swapped for theirs.
 */
export default function MainPageSkeletonBody({ cover, pinned, label }: { cover: boolean; pinned: boolean; label: string }) {
  const { T } = useLanguage()

  return (
    <div ref={homeFit} className={`home-fit flex flex-col min-h-full ${cover ? 'home-if-cover' : 'home-if-classic'}`}>
      {cover && <MainPagePortadaSkeleton />}

      <div aria-hidden="true" className="home-fit-top flex-1 min-h-0 grid grid-cols-1 items-stretch lg:grid-cols-[2fr_1fr]">
        {/* Profile: first on a phone, right column on desktop, like the page. */}
        <div className="home-fit-side min-h-0 min-w-0 flex flex-col lg:col-start-2 lg:row-start-1">
          {cover ? (
            <PortadaSideSkeleton />
          ) : (
            <section className="main-content m-3 rounded-tile flex flex-col items-center gap-3 overflow-y-auto">
              <Skeleton radius="tile" className="if-platform-tabs h-[55px] lg:h-10 w-full shrink-0" />
              <MainPageProfileSkeleton label={label} />
            </section>
          )}
        </div>

        <div className="home-fit-main flex flex-col min-h-0 min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="m-3 bg-bg-card rounded-tile p-4 flex flex-col flex-1 min-h-0 gap-2">
            <Skeleton className="h-[72px] sm:h-[2.125rem] w-48 max-w-full shrink-0" />
            {pinned ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: PINS }, (_, i) => (
                  <GameRowSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="home-fit-scroll flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
                {Array.from({ length: ROWS }, (_, i) => (
                  <GameRowSkeleton key={i} className="flex-1 min-h-[116px] lg:min-h-0" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The first section of Stats & Activity, the one that opens. */}
      <div aria-hidden="true" data-stats-section="overview" className="p-4 flex flex-col gap-4">
        <Skeleton className="h-7 w-44" />
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(180px,220px)_1fr] gap-4 lg:items-start">
          <div className="-mx-4 px-4 py-2 lg:mx-0 lg:p-2 lg:self-stretch lg:bg-bg-card lg:rounded-card flex lg:flex-col gap-1 overflow-hidden">
            {Array.from({ length: SECTIONS }, (_, i) => (
              <Skeleton key={i} radius="tile" className="h-9 lg:h-10 w-28 lg:w-full shrink-0" />
            ))}
          </div>
          <div className="min-w-0 flex flex-col gap-4">
            <div className="flex flex-wrap content-start gap-3 min-h-[183px] lg:min-h-0">
              {Array.from({ length: STATS }, (_, i) => (
                <div key={i} className="px-3 py-1 flex flex-col gap-1 flex-1 min-w-24">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-[1.875rem] w-14" />
                  <Skeleton className="h-3 w-12 mt-0.5" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="bg-bg-card rounded-tile p-4 flex flex-col gap-3 h-full xl:col-span-2">
                <MainPageHeatmap achievements={NO_ACHIEVEMENTS} isLoading />
              </div>
              <div className="bg-bg-card rounded-tile p-4 flex flex-col gap-3 h-full">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.dailyAchievements}</p>
                <AchievementsLineChart achievements={NO_ACHIEVEMENTS} isLoading />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
