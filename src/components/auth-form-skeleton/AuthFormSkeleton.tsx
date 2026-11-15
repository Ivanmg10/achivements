'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

/** The fields and the button of a small sign-in form while it gets ready. `label` says what is happening to a screen reader. */
export default function AuthFormSkeleton({ label, fields = 2 }: { label?: string; fields?: number }) {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" aria-label={label ?? T.loadingPage.title} className="flex flex-col gap-3 w-full">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton radius="field" className="h-[3.25rem]" />
        </div>
      ))}
      <Skeleton radius="button" className="h-12 mt-2" />
    </div>
  )
}
