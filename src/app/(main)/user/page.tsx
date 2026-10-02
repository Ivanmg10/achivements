'use client'

import UserIdentityCard from '@/components/user-page/user-identity-card/UserIdentityCard'
import UserPreferencesCard from '@/components/user-page/user-preferences-card/UserPreferencesCard'
import UserPlatforms from '@/components/user-page/user-platforms/UserPlatforms'
import DeleteAccountCard from '@/components/user-page/delete-account-card/DeleteAccountCard'

/**
 * The account page: who you are and how the app behaves on the top row, the
 * platforms you track games on in the middle, and deleting the account
 * last. The admin panel, for those who have one, opens from the top card.
 */
export default function UserPage() {
  return (
    <main className="min-h-screen bg-bg-main text-text-main flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[95%] flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
          <UserIdentityCard />
          <UserPreferencesCard />
        </div>

        <UserPlatforms />

        <DeleteAccountCard />
      </div>
    </main>
  )
}
