import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useRaLink } from '@/hooks/useRaLink'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageRaGuide from '@/components/welcome-page/welcome-page-ra-guide/WelcomePageRaGuide'
import { INPUT_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, platformKicker } from '@/components/welcome-page/welcomeArt'

const FORM_ID = 'welcome-ra-form'

/**
 * RetroAchievements, the one platform that asks for a key: the username and
 * Web API key on the left, the guide to finding the key on the right. A
 * refused key is said under the fields; a link toasts and moves on.
 */
export default function WelcomePageRa({
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
  const { T } = useLanguage()
  const t = T.welcome.ra
  const { link, isLinking, error, clearError } = useRaLink()
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const linkedAs = session?.user?.rausername

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!(await link(username.trim(), apiKey.trim()))) return
    notify.success(T.toast.raLinked)
    onNext()
  }

  return (
    <WelcomePageStep
      kicker={platformKicker(T, 'ra')}
      title={T.welcome.steps.ra}
      body={linkedAs ? t.linkedAs.replace('{name}', linkedAs) : t.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      wideAside={!linkedAs}
      asideLabel={t.guideTitle}
      aside={linkedAs ? undefined : <WelcomePageRaGuide />}
      actions={
        linkedAs ? (
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <>
            <button type="submit" form={FORM_ID} disabled={isLinking || !username.trim() || !apiKey.trim()} className={PRIMARY_BUTTON}>
              {isLinking ? t.connecting : t.connect}
            </button>
            <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
              {T.welcome.notNow}
            </button>
          </>
        )
      }
    >
      {!linkedAs && (
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 max-w-md">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="welcome-ra-user" className="text-sm font-semibold">{t.username}</label>
            <input
              id="welcome-ra-user"
              autoComplete="username"
              spellCheck={false}
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError() }}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="welcome-ra-key" className="text-sm font-semibold">{t.apiKey}</label>
            <input
              id="welcome-ra-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); clearError() }}
              aria-invalid={error !== null}
              aria-describedby={error ? 'welcome-ra-error welcome-ra-note' : 'welcome-ra-note'}
              className={`${INPUT_CLASS} ${error ? 'ring-2 ring-danger' : ''}`}
            />
            {error && (
              <p id="welcome-ra-error" role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <p id="welcome-ra-note" className="text-[13px] leading-snug text-text-secondary">{t.keyNote}</p>
          </div>
        </form>
      )}
    </WelcomePageStep>
  )
}
