'use client'

import { useLanguage } from '@/context/LanguageContext'
import GroupListSkeleton from '@/components/groups/group-list-skeleton/GroupListSkeleton'

export default function GroupsLoading() {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-main">{T.groups.title}</h1>
        <GroupListSkeleton />
      </div>
    </div>
  )
}
