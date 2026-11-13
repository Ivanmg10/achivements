import { Skeleton } from '@/components/ui/Skeleton'
import { TABLE, TH, TD } from '@/components/ui/dataTable'

const ROWS = 10

/** The users tab's table while it loads: ten rows on the boxes of `AdminUserRow`. */
export default function AdminUsersSkeleton() {
  return (
    <div role="status" aria-busy="true" className="overflow-x-auto">
      <span className="sr-only">Loading users...</span>
      <table aria-hidden="true" className={TABLE}>
        <thead>
          <tr>
            <th className={`${TH} text-left`}><Skeleton className="h-3 w-10" /></th>
            <th className={`${TH} text-left`}><Skeleton className="h-3 w-6" /></th>
            <th className={`${TH} text-left hidden md:table-cell`}><Skeleton className="h-3 w-10" /></th>
            <th className={`${TH} text-left`}><Skeleton className="h-3 w-14" /></th>
            <th className={`${TH} text-left`}><Skeleton className="h-3 w-8" /></th>
            <th className={TH} />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, i) => (
            <tr key={i}>
              <td className={TD}>
                <div className="flex items-center gap-2.5">
                  <Skeleton radius="circle" className="size-8 shrink-0" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </td>
              <td className={TD}><Skeleton className="h-3 w-8" /></td>
              <td className={`${TD} hidden md:table-cell`}><Skeleton className="h-3 w-40" /></td>
              <td className={TD}><Skeleton className="h-4 w-16" /></td>
              <td className={TD}><Skeleton radius="tag" className="h-5 w-12" /></td>
              <td className={TD}><Skeleton radius="button" className="h-8 w-24 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
