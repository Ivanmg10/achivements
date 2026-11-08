import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { codeToFlag, findCountry } from '@/utils/countries'
import styles from '@/components/welcome-page/WelcomePage.module.css'
import { kickerClass } from '@/components/ui/Kicker'
import Avatar from '@/components/ui/Avatar'

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
      <span className={`${styles.in} ${kickerClass('muted', 'md')}`}>{T.welcome.profile.preview}</span>
      <div className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06] overflow-hidden`}>
        <div className="h-20 bg-linear-to-br from-accent/55 to-bg-card" />
        <div className="px-5 pb-5 -mt-10 flex flex-col gap-2 min-w-0">
          <Avatar src={user?.avatar} name={user?.name ?? ''} size={80} fallback="icon" online={online} announce ring="ring-4 ring-bg-card" />
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
