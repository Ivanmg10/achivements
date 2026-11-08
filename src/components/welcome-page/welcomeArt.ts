import { PLATFORM_STEPS, type PlatformStep, type WelcomeStep } from '@/hooks/useWelcomeSteps'
import type { Translations } from '@/translations/en'
import { buttonClass } from '@/components/ui/Button'

/**
 * Each step's "sky" in the curtain's band, as the time of day is in the game
 * this is after: the platform's colours for a platform, the theme's accent
 * for the rest. Platform colours live only here and in their logos, never on
 * a progress bar.
 */
export const STEP_SKY: Record<WelcomeStep, string> = {
  intro: 'linear-gradient(135deg, color-mix(in oklab, rgb(var(--accent)) 70%, #000), rgb(var(--accent)))',
  ra: 'linear-gradient(135deg, var(--color-ra) 10%, var(--color-ra-gold) 95%)',
  steam: 'linear-gradient(135deg, var(--color-steam-night) 0%, var(--color-steam-dark) 55%, var(--color-steam-sky) 100%)',
  psn: 'linear-gradient(135deg, var(--color-psn-night), var(--color-psn))',
  profile: 'linear-gradient(135deg, rgb(var(--accent)), color-mix(in oklab, rgb(var(--accent)) 40%, #fff))',
  prefs: 'linear-gradient(135deg, rgb(var(--accent)), var(--color-art-pink))',
  privacy: 'linear-gradient(135deg, rgb(var(--accent)), var(--color-art-cyan))',
  done: 'linear-gradient(135deg, rgb(var(--accent)), #fff)',
}

/** "Platforms · 2 of 3": counted from PLATFORM_STEPS, so a new platform needs no text change. */
export function platformKicker(T: Translations, step: PlatformStep): string {
  return T.welcome.platformsKicker
    .replace('{n}', String(PLATFORM_STEPS.indexOf(step) + 1))
    .replace('{total}', String(PLATFORM_STEPS.length))
}

export const PRIMARY_BUTTON = buttonClass('primary', 'lg')

export const SECONDARY_BUTTON = buttonClass('secondary', 'lg')

export const QUIET_BUTTON = buttonClass('quiet', 'sm')

/** The arrows that go through the opened points and choices. */
export const ICON_BUTTON =
  'w-11 h-11 rounded-tile flex items-center justify-center ring-1 ring-inset ring-ink/15 text-text-main hover:bg-ink/5 disabled:opacity-30 disabled:cursor-default transition-colors focus-ring'
