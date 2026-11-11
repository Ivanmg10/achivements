'use client'

import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'

/** A platform's game page for someone who has not linked that platform: says so and points to the account page. */
export default function GamePageNotLinked({ platform, connectLabel }: { platform: string; connectLabel: string }) {
  const { T } = useLanguage()
  return (
    <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3 p-6 text-center">
      <p className="text-text-secondary">{platform} · {T.userData.notConnected}</p>
      <Button href="/user" size="sm">
        {connectLabel}
      </Button>
    </main>
  )
}
