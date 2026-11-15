import { useSession } from 'next-auth/react'

/** A PSN account is linked but not proven to be the user's, so its trophies add no Vault Points (#176). */
export function usePsnUnverified(): boolean {
  const user = useSession().data?.user
  return Boolean(user?.psnaccountid) && user?.psnVerified !== true
}
