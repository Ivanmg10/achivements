'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useMainPlatform, type MainPlatform } from '@/context/MainPlatformContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import MainPageProfileTabs, { profilePanelId, profileTabId } from '@/components/main-page/main-page-profile/main-page-profile-tabs/MainPageProfileTabs'
import MainPageCharts from '@/components/main-page/main-page-charts/MainPageCharts'

const ID_PREFIX = 'public-activity-platform'

/**
 * Their stats in full: the main page's Stats & Activity, read as them. The
 * cards built on one platform's ideas (points, consoles, best performance)
 * follow the platform picked here — the same choice as the profile column's.
 */
export default function PublicUserActivity() {
  const { T } = useLanguage()
  const { platform, setPlatform, linked } = useMainPlatform()
  const tabbed = linked.length > 1

  return (
    <div className="flex flex-col gap-2">
      {tabbed && (
        <div className="bg-bg-card rounded-xl px-4 pt-3">
          <MainPageProfileTabs<MainPlatform>
            idPrefix={ID_PREFIX}
            label={T.userProfile.statsPlatform}
            selected={platform}
            onSelect={setPlatform}
            tabs={linked.map((p) => ({ id: p, label: PLATFORM_NAME[p] }))}
          />
        </div>
      )}
      <div
        role={tabbed ? 'tabpanel' : undefined}
        id={tabbed ? profilePanelId(ID_PREFIX, platform) : undefined}
        aria-labelledby={tabbed ? profileTabId(ID_PREFIX, platform) : undefined}
        className="-mx-4 [&>section]:bg-transparent"
      >
        <MainPageCharts />
      </div>
    </div>
  )
}
