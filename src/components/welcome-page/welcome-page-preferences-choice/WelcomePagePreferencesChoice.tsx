import type { LookChoice } from '@/hooks/useWelcomeChoice'
import { useLanguage } from '@/context/LanguageContext'
import { LANGUAGES, type Lang } from '@/utils/languages'
import Select from '@/components/ui/Select'
import UserShapePreference from '@/components/user-page/user-shape-preference/UserShapePreference'
import UserFontPreference from '@/components/user-page/user-font-preference/UserFontPreference'
import UserGameCardPreference from '@/components/user-page/user-game-card-preference/UserGameCardPreference'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'
import WelcomePagePreferencesThemes from '@/components/welcome-page/welcome-page-preferences-themes/WelcomePagePreferencesThemes'

/** What one look choice offers, inside its opened row: the account's own preferences, so there is no second way to save one. */
export default function WelcomePagePreferencesChoice({ choice }: { choice: LookChoice }) {
  const { T, lang, setLang, fromBrowser } = useLanguage()

  if (choice === 'theme') return <WelcomePagePreferencesThemes />
  if (choice === 'shape') return <UserShapePreference />
  if (choice === 'font') return <UserFontPreference columns={2} />
  if (choice === 'home') return <UserHomeLayoutPreference />
  if (choice === 'cards') return <UserGameCardPreference />

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="welcome-language" className="sr-only">{T.userConfig.language}</label>
      <Select<Lang>
        id="welcome-language"
        value={lang}
        onChange={setLang}
        aria-describedby="welcome-language-hint"
        options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
      />
      <span id="welcome-language-hint" className="text-[0.8125rem] text-text-secondary">
        {fromBrowser ? T.welcome.prefs.detected : T.welcome.prefs.chosen}
      </span>
    </div>
  )
}
