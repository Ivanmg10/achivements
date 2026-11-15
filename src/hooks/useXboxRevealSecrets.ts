import { useStoredSwitch } from '@/hooks/useStoredSwitch'

/**
 * Whether secret Xbox achievements start out shown (spoilers) or concealed
 * (the default). Remembered in this browser; the eye on each achievement still
 * flips it for that one.
 */
export const useXboxRevealSecrets = () => useStoredSwitch('xbox-secret-achievements', 'conceal', 'reveal')
