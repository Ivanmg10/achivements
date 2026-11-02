'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import GroupListSkeleton from '@/components/groups/group-list-skeleton/GroupListSkeleton'

export default function GroupsLoading() {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1 text-text-main">{T.groups.title}</h1>
            <Skeleton className="h-5 w-24 mt-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton radius="control" className="h-9 w-20" />
            <Skeleton radius="button" className="h-11 w-36" />
          </div>
        </div>
        <GroupListSkeleton />
      </div>
    </div>
  )
}
