import { useStoredSwitch } from '@/hooks/useStoredSwitch'

/**
 * Whether a PSN game with its platinum counts as completed, or only the whole
 * set at 100% does (the default). Remembered in this browser, like the theme.
 */
export const usePsnPlatinumCompletes = () => useStoredSwitch('psn-completion', 'full', 'platinum')
