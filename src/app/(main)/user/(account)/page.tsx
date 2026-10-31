'use client'

import { useSession } from 'next-auth/react'
import UserIdentityCard from '@/components/user-page/user-identity-card/UserIdentityCard'
import UserPreferencesCard from '@/components/user-page/user-preferences-card/UserPreferencesCard'
import UserPlatforms from '@/components/user-page/user-platforms/UserPlatforms'
import RaKeyInvalidNotice from '@/components/ra-key-invalid-notice/RaKeyInvalidNotice'
import DeleteAccountCard from '@/components/user-page/delete-account-card/DeleteAccountCard'
import UserPageSkeleton from '@/components/user-page/user-page-skeleton/UserPageSkeleton'

/**
 * The account page: who you are and how the app behaves on the top row, the
 * platforms you track games on in the middle, and deleting the account
 * last. The admin panel, for those who have one, opens from the top card.
 */
export default function UserPage() {
  const { status, data: session } = useSession()

  // On a full load the session comes after the first paint, and it decides the page's shape (the
  // admin button, Xbox's card): its skeleton holds until then, as the home's does. Only the first
  // read: update() sets the status back to 'loading' for a moment with the session still in hand.
  if (status === 'loading' && !session) return <UserPageSkeleton />

  return (
    <main className="min-h-screen bg-bg-main text-text-main flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[95%] flex flex-col gap-4">
        <RaKeyInvalidNotice />
        {/* The danger zone under the account's card, so the two columns end together. */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="flex flex-col gap-4 min-w-0">
            <UserIdentityCard />
            <DeleteAccountCard />
          </div>
          <UserPreferencesCard />
        </div>

        <UserPlatforms />
      </div>
    </main>
  )
}
