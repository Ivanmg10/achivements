'use client'

import GroupDetailSkeleton from '@/components/groups/group-detail-skeleton/GroupDetailSkeleton'

export default function GroupDetailLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <GroupDetailSkeleton />
      </div>
    </div>
  )
}
