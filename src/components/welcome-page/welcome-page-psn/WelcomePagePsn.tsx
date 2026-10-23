import { useState } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { usePsnLink } from '@/hooks/usePsnLink'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageLibraryPreview from '@/components/welcome-page/welcome-page-library-preview/WelcomePageLibraryPreview'
import { INPUT_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, STEP_SKY, platformKicker } from '@/components/welcome-page/welcomeArt'

const FORM_ID = 'welcome-psn-form'
const INPUT_ID = 'welcome-psn-id'

/** PlayStation by online ID, as on the account page (`usePsnLink`); a refusal is said under the box. */
export default function WelcomePagePsn({
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
  const { T } = useLanguage()
  const { isLinked, username: linkedAs, link, isLinking, error } = usePsnLink()
  const [username, setUsername] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !(await link(username.trim()))) return
    notify.success(T.toast.psnLinked)
    onNext()
  }

  return (
    <WelcomePageStep
      kicker={platformKicker(T, 'psn')}
      title={T.welcome.steps.psn}
      body={isLinked && linkedAs ? T.welcome.ra.linkedAs.replace('{name}', linkedAs) : T.welcome.psn.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={T.welcome.library.title}
      aside={<WelcomePageLibraryPreview art={STEP_SKY.psn} />}
      actions={
        isLinked ? (
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <>
            <button type="submit" form={FORM_ID} disabled={isLinking || !username.trim()} className={PRIMARY_BUTTON}>
              {isLinking ? T.psn.connecting : T.welcome.psn.connect}
            </button>
            <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
              {T.welcome.notNow}
            </button>
          </>
        )
      }
    >
      {!isLinked && (
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-1.5 max-w-md">
          <label htmlFor={INPUT_ID} className="text-sm font-semibold">{T.psn.usernameLabel}</label>
          <input
            id={INPUT_ID}
            autoComplete="off"
            spellCheck={false}
            maxLength={16}
            placeholder={T.psn.usernamePlaceholder}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? `${INPUT_ID}-error ${INPUT_ID}-help` : `${INPUT_ID}-help`}
            className={`${INPUT_CLASS} ${error ? 'ring-2 ring-danger' : ''}`}
          />
          {error && (
            <p id={`${INPUT_ID}-error`} role="alert" className="text-sm text-danger">
              {T.psn.errors[error]}
            </p>
          )}
          <p id={`${INPUT_ID}-help`} className="text-[0.8125rem] text-text-secondary">{T.welcome.psn.help}</p>
        </form>
      )}
      {/* Its trophies being read for Vault Points, or why they cannot be (private trophies). */}
      {isLinked && (
        <div className="max-w-md">
          <VaultFillLine source="psn" />
        </div>
      )}
    </WelcomePageStep>
  )
}
