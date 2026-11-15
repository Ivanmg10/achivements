import { useStoredSwitch } from '@/hooks/useStoredSwitch'

/**
 * Whether hidden PSN trophies start out shown (spoilers) or concealed (the
 * default). Remembered in this browser; the eye on each trophy still flips it
 * for that trophy.
 */
export const usePsnRevealHidden = () => useStoredSwitch('psn-hidden-trophies', 'conceal', 'reveal')
