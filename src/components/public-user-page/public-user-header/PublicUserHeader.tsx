'use client'

import Image from 'next/image'
import { IconUser } from '@tabler/icons-react'
import { codeToFlag, findCountry } from '@/utils/countries'
import type { CheevoUser } from '@/hooks/useCheevoUser'

/** Who a CheevoVault user is: avatar, name, country and what they wrote about themselves. */
export default function PublicUserHeader({ user }: { user: CheevoUser }) {
  const country = user.location ? findCountry(user.location) : null

  return (
    <header className="m-3 bg-bg-card rounded-xl p-4 flex items-start gap-4">
      {user.avatar ? (
        <Image src={user.avatar} alt="" width={96} height={96} className="rounded-full w-20 h-20 sm:w-24 sm:h-24 object-cover shrink-0 bg-bg-main ring-2 ring-ink/10" unoptimized />
      ) : (
        <span aria-hidden="true" className="rounded-full w-20 h-20 sm:w-24 sm:h-24 bg-bg-main flex items-center justify-center shrink-0">
          <IconUser size={32} className="text-text-secondary" />
        </span>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{user.username}</h1>
        {country && (
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="text-lg leading-none" aria-hidden="true">{codeToFlag(country.code)}</span>
            {country.name}
          </p>
        )}
        {user.description && <p className="text-sm text-text-main whitespace-pre-line wrap-break-word">{user.description}</p>}
      </div>
    </header>
  )
}
