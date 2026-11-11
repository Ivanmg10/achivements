'use client'

import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import UserRaCard from '@/components/user-page/user-ra-card/UserRaCard'
import UserSteamCard from '@/components/user-page/user-steam-card/UserSteamCard'
import UserPsnCard from '@/components/user-page/user-psn-card/UserPsnCard'
import UserXboxCard from '@/components/user-page/user-xbox-card/UserXboxCard'

/**
 * The platforms CheevoVault can track, side by side: who you are on
 * each one, the five numbers worth knowing at a glance, and the button that
 * connects or disconnects it.
 */
export default function UserPlatforms() {
  const xboxEnabled = useXboxEnabled()

  return (
    // Xbox is a fourth card, only for who may use it (an admin, for now): three columns otherwise.
    <div className={`grid grid-cols-1 gap-4 enter-cards ${xboxEnabled ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
      <UserRaCard />
      <UserSteamCard />
      <UserPsnCard />
      <UserXboxCard />
    </div>
  )
}
