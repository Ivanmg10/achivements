import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { codeToFlag, findCountry } from '@/utils/countries'
import PresenceDot from '@/components/presence-dot/PresenceDot'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const GENDER_KEYS = { male: 'genderMale', female: 'genderFemale', neutral: 'genderNeutral' } as const

/**
 * The profile as others will see it, from the session, so it follows each
 * change as it is saved. A long description wraps (even one unbroken word)
 * and stops at four lines. `online` shows the presence dot others would see.
 */
export default function WelcomePageProfilePreview({ online = false }: { online?: boolean }) {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const user = session?.user
  const country = user?.location ? findCountry(user.location) : undefined
  const gender = user?.gender && user.genderPublic ? T.userData[GENDER_KEYS[user.gender]] : null
  const meta = [country ? `${codeToFlag(country.code)} ${country.name}` : T.welcome.profile.noCountry, gender].filter(Boolean).join(' · ')

  return (
    <>
      <span className={`${styles.in} text-xs font-bold uppercase tracking-[0.12em] text-text-secondary`}>{T.welcome.profile.preview}</span>
      <div className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06] overflow-hidden`}>
        <div className="h-20 bg-linear-to-br from-accent/55 to-bg-card" />
        <div className="px-5 pb-5 -mt-10 flex flex-col gap-2 min-w-0">
          <span className="relative w-20 h-20">
            {user?.avatar ? (
              <Image src={user.avatar} alt="" width={80} height={80} unoptimized className="w-20 h-20 rounded-full object-cover ring-4 ring-bg-card" />
            ) : (
              <span className="w-20 h-20 rounded-full bg-bg-main ring-4 ring-bg-card flex items-center justify-center text-text-secondary">
                <IconUser size={28} aria-hidden="true" />
              </span>
            )}
            <PresenceDot online={online} size="lg" announce />
          </span>
          <span className="text-xl font-extrabold tracking-tight truncate">{user?.name}</span>
          <span className="text-[0.8125rem] text-text-secondary">{meta}</span>
          <p className={`text-sm leading-relaxed [overflow-wrap:anywhere] line-clamp-4 ${user?.description ? 'text-text-main' : 'text-text-secondary italic'}`}>
            {user?.description || T.welcome.profile.noDescription}
          </p>
        </div>
      </div>
    </>
  )
}
