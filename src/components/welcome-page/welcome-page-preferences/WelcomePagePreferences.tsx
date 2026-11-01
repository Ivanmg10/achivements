import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { IconArrowRight, IconBroadcast, IconTrophy, IconWorld } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useLanguage } from '@/context/LanguageContext'
import { LANGUAGES, type Lang } from '@/utils/languages'
import type { Theme } from '@/types/types'
import ThemeModalOption from '@/components/theme-modal/theme-modal-option/ThemeModalOption'
import UserProfileSwitch from '@/components/user-page/user-profile-switch/UserProfileSwitch'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import { PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, SECTION_LABEL } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'
import Select from '@/components/ui/Select'
import UserShapePreference from '@/components/user-page/user-shape-preference/UserShapePreference'
import UserFontPreference from '@/components/user-page/user-font-preference/UserFontPreference'
import UserGameCardPreference from '@/components/user-page/user-game-card-preference/UserGameCardPreference'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'

const ThemeModal = dynamic(() => import('@/components/theme-modal/ThemeModal'), { loading: () => null })

/** A short pick of the themes, dark ones with distinct accents; the rest are one click away. */
const FEATURED_THEMES: Theme[] = ['dark', 'dark-red', 'dark-blue', 'gruvbox', 'black-ops-2', 'san-andreas', 'snake-eater', 'venom']

/**
 * How the app reads and looks, and what others see: the language (the
 * browser's until the person picks one, and it says so), a theme applied on
 * the spot and saved on the account, and the three privacy switches of the
 * account page.
 */
export default function WelcomePagePreferences({
  onNext,
  onSkip,
  onBack,
  direction,
  focusTitle,
}: {
  onNext: () => void
  onSkip: () => void
  onBack: () => void
  direction: WelcomeDirection
  focusTitle: boolean
}) {
  const { data: session } = useSession()
  const { T, lang, setLang, fromBrowser } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()
  const { me: vault, setShowInRankings } = useVaultMe()
  const [allThemes, setAllThemes] = useState(false)
  const t = T.welcome.prefs
  const user = session?.user

  return (
    <WelcomePageStep
      kicker={t.kicker}
      title={t.title}
      body={t.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={t.others}
      aside={
        <>
          <span className={`${styles.in} ${SECTION_LABEL}`}>{t.others}</span>
          <div className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06] p-3 flex flex-col`}>
            <UserProfileSwitch
              field="profilePublic"
              checked={user?.profilePublic !== false}
              label={T.userData.profilePublic}
              onText={T.userData.profilePublicOn}
              offText={T.userData.profilePublicOff}
              icon={<IconWorld size={18} />}
            />
            <UserProfileSwitch
              field="showPresence"
              checked={user?.showPresence !== false}
              label={T.userData.showPresence}
              onText={T.userData.showPresenceOn}
              offText={T.userData.showPresenceOff}
              icon={<IconBroadcast size={18} />}
            />
            {vault && (
              <UserProfileSwitch
                field="showInRankings"
                checked={vault.showInRankings}
                label={T.rankings.showInRankings}
                onText={T.rankings.showInRankingsOn}
                offText={T.rankings.showInRankingsOff}
                icon={<IconTrophy size={18} />}
                onSaved={setShowInRankings}
              />
            )}
          </div>
        </>
      }
      actions={
        <>
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
            {T.welcome.skipStep}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5 max-w-2xl">
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label htmlFor="welcome-language" className="text-sm font-semibold">{T.userConfig.language}</label>
          <Select<Lang>
            id="welcome-language"
            value={lang}
            onChange={setLang}
            aria-describedby="welcome-language-hint"
            options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
          />
          <span id="welcome-language-hint" className="text-[0.8125rem] text-text-secondary">{fromBrowser ? t.detected : t.chosen}</span>
        </div>

        <div className="max-w-md flex flex-col gap-5">
          <UserHomeLayoutPreference />
          <UserGameCardPreference />
          <UserShapePreference />
          <UserFontPreference />
        </div>

        <div className="flex flex-col gap-2">
          <span id="welcome-theme" className="text-sm font-semibold">
            {T.userTheme.theme} <span className="font-normal text-text-secondary">· {t.themeHint}</span>
          </span>
          <div role="radiogroup" aria-labelledby="welcome-theme" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FEATURED_THEMES.map((id) => (
              <ThemeModalOption key={id} theme={id} checked={theme === id} onSelect={(id) => choose(id)} />
            ))}
          </div>
          {saveError && (
            <p role="alert" className="text-sm text-danger">{T.userTheme.saveError}</p>
          )}
          <button type="button" onClick={() => setAllThemes(true)} className={`${QUIET_BUTTON} self-start -ml-2`}>
            {t.allThemes}
          </button>
        </div>
      </div>

      <LazyWhenOpened open={allThemes}>
        <ThemeModal isOpen={allThemes} onClose={() => setAllThemes(false)} />
      </LazyWhenOpened>
    </WelcomePageStep>
  )
}
