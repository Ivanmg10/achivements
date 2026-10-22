import { Fragment, type ReactNode } from 'react'
import { IconCheck, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { WELCOME_STEPS, type WelcomeStep } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { QUIET_BUTTON } from '@/components/welcome-page/welcomeArt'

export type WelcomeStepState = 'current' | 'done' | 'linked' | 'later' | 'pending'

const PLATFORM_MARK: Partial<Record<WelcomeStep, ReactNode>> = {
  ra: <RaLogo height={10} />,
  steam: <SteamLogo size={14} className="text-[#66c0f4]" aria-hidden="true" />,
  psn: <PlaystationLogo size={14} className="text-[#0070d1]" aria-hidden="true" />,
}

/**
 * The welcome's steps along the top, in the app's own floating bar: each one a
 * pill like the header's links, the current one ringed and in the accent
 * (`aria-current`, and bolder, so it is not colour alone). Done steps carry a
 * tick (a linked platform, its logo), skipped ones a hollow dot; steps not
 * reached yet cannot be jumped to. A 2 px line along the bottom is how far the
 * person has got. On a phone it folds into "Step n of 7" and seven segments.
 * It stays above the curtain, so the step is seen changing as it passes.
 */
export default function WelcomePageStepsBar({
  index,
  seen,
  states,
  onGo,
  onBack,
  onSkipAll,
}: {
  index: number
  seen: number
  states: WelcomeStepState[]
  onGo: (index: number) => void
  onBack: () => void
  onSkipAll: () => void
}) {
  const { T } = useLanguage()
  const total = WELCOME_STEPS.length
  const progress = `${Math.round((seen / (total - 1)) * 100)}%`
  const count = (template: string) => template.replace('{n}', String(index + 1)).replace('{total}', String(total))

  return (
    <header className="fixed top-2 inset-x-2 sm:top-3 sm:inset-x-4 z-30">
      <div className="relative overflow-hidden rounded-2xl bg-bg-card/80 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-ink/[0.07] shadow-lg shadow-black/20 2xl:[zoom:1.15] min-[2200px]:[zoom:1.3]">
        <div className="hidden lg:flex items-center gap-3 h-15 pl-5 pr-2.5">
          <span className="font-extrabold text-[17px] tracking-tight shrink-0">
            Cheevo<span className="text-accent">Vault</span>
          </span>
          <nav aria-label={T.welcome.stepsLabel} className="flex-1 flex justify-center min-w-0">
            <ol className="flex items-center gap-0.5">
              {WELCOME_STEPS.map((step, i) => {
                const state = states[i]
                const name = T.welcome.steps[step]
                return (
                  <Fragment key={step}>
                    {i > 0 && <IconChevronRight size={12} aria-hidden="true" className="text-ink/25 shrink-0" />}
                    <li>
                      <button
                        type="button"
                        onClick={() => onGo(i)}
                        disabled={i > seen}
                        aria-current={state === 'current' ? 'step' : undefined}
                        aria-label={`${name}, ${T.welcome.state[state]}`}
                        className={`inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full text-[13px] whitespace-nowrap transition-colors disabled:opacity-45 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                          state === 'current'
                            ? 'text-accent font-semibold bg-accent/10 ring-1 ring-inset ring-ink/15'
                            : state === 'done' || state === 'linked'
                              ? 'text-text-main font-medium hover:bg-ink/5'
                              : 'text-text-secondary font-medium enabled:hover:text-text-main enabled:hover:bg-ink/5'
                        }`}
                      >
                        {state === 'done' && <IconCheck size={14} aria-hidden="true" className="text-accent" />}
                        {state === 'linked' && PLATFORM_MARK[step]}
                        {state === 'later' && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full ring-[1.5px] ring-current" />}
                        {name}
                      </button>
                    </li>
                  </Fragment>
                )
              })}
            </ol>
          </nav>
          <span className="text-[13px] text-text-secondary shrink-0 tabular-nums">{count(T.welcome.shortCount)}</span>
          <button type="button" onClick={onSkipAll} className={QUIET_BUTTON}>
            {T.welcome.skipAll}
          </button>
        </div>

        <div className="lg:hidden flex flex-col gap-1.5 px-1.5 pt-1.5 pb-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onBack}
              disabled={index === 0}
              aria-label={T.welcome.back}
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconChevronLeft size={20} aria-hidden="true" />
            </button>
            <span className="flex-1 min-w-0 flex flex-col">
              <span className="text-xs text-text-secondary">{count(T.welcome.stepCount)}</span>
              <span className="text-[15px] font-bold truncate">{T.welcome.steps[WELCOME_STEPS[index]]}</span>
            </span>
            <button type="button" onClick={onSkipAll} className={QUIET_BUTTON}>
              {T.welcome.skipAll}
            </button>
          </div>
          <ol aria-hidden="true" className="grid grid-cols-7 gap-1 mx-2">
            {WELCOME_STEPS.map((step, i) => (
              <li key={step} className={`h-1 rounded-full transition-colors ${i < index ? 'bg-progress' : i === index ? 'bg-progress-soft' : 'bg-ink/10'}`} />
            ))}
          </ol>
        </div>

        <span
          aria-hidden="true"
          className="hidden lg:block absolute left-0 bottom-0 h-0.5 bg-progress rounded-r-full transition-[width] duration-500 ease-out"
          style={{ width: progress }}
        />
      </div>
      {/* Said once per step, not on every render of the pills. */}
      <p role="status" className="sr-only">
        {`${count(T.welcome.stepCount)} · ${T.welcome.steps[WELCOME_STEPS[index]]}`}
      </p>
    </header>
  )
}
