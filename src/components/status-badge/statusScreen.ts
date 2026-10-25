import { buttonClass } from '@/components/ui/Button'

/** The two buttons of the 404 and error screens: the way out, and the other one. */
export const STATUS_BUTTON = {
  primary: buttonClass('primary', 'md'),
  secondary: buttonClass('secondary', 'md'),
}

/**
 * How tall the 404 and error screens are. Inside the app they fill what the
 * header (64 px with its margin) and the footer (49 px) leave, so they sit in
 * the middle: the layout's <main> is a block, so flex-1 would not stretch them.
 * Full screen (no layout around), they are the page's <main>.
 */
export const STATUS_SCREEN = {
  inApp: 'min-h-[calc(100dvh-7rem)]',
  fullScreen: 'min-h-screen bg-bg-main',
}
