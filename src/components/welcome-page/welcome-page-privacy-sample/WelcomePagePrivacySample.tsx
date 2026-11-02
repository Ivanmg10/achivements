import { IconLock, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import WelcomePageProfilePreview from '@/components/welcome-page/welcome-page-profile-preview/WelcomePageProfilePreview'
import { SECTION_LABEL } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const CARD = `${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06]`

/**
 * What the privacy switches do, on the person's own profile card and their
 * line in the rankings. A private profile is not listed, whatever its switch
 * says, as in the rankings themselves.
 */
export default function WelcomePagePrivacySample({
  profilePublic,
  showPresence,
  showInRankings,
  rank,
}: {
  profilePublic: boolean
  showPresence: boolean
  showInRankings: boolean
  rank: number
}) {
  const { T, lang } = useLanguage()
  const listed = profilePublic && showInRankings

  return (
    <>
      {profilePublic ? (
        <WelcomePageProfilePreview online={showPresence} />
      ) : (
        <>
          <span className={`${styles.in} ${SECTION_LABEL}`}>{T.welcome.profile.preview}</span>
          <div className={`${CARD} flex items-center gap-3 p-4`}>
            <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-tile bg-ink/10 text-text-secondary flex items-center justify-center">
              <IconLock size={20} />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-[0.9375rem] font-bold">{T.welcome.privacy.privateTitle}</span>
              <span className="text-[0.8125rem] text-text-secondary">{T.userData.profilePublicOff}</span>
            </span>
          </div>
        </>
      )}

      <div className={`${CARD} flex items-center gap-3 p-3`}>
        <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-tile bg-accent/15 text-accent flex items-center justify-center">
          <IconTrophy size={20} />
        </span>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-[0.9375rem] font-bold">{T.rankings.title}</span>
          <span className="text-[0.8125rem] text-text-secondary">{listed ? T.rankings.showInRankingsOn : T.rankings.showInRankingsOff}</span>
        </span>
        {listed && rank > 0 && <span className="font-display italic font-extrabold text-2xl shrink-0">#{rank.toLocaleString(lang)}</span>}
      </div>
    </>
  )
}
