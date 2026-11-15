'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import LoginUserForm from '@/components/login-user-form/LoginUserForm'
import RegisterUserForm from '@/components/register-user-form/RegisterUserForm'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import LegalLinks from '@/components/legal-links/LegalLinks'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import AuthPhoneFrame from '@/components/auth-phone-frame/AuthPhoneFrame'
import AuthFormCard from '@/components/auth-form-card/AuthFormCard'
import AuthDesktopFormPanel from '@/components/auth-desktop-form-panel/AuthDesktopFormPanel'
import SteamSignupForm from '@/components/steam-signup-form/SteamSignupForm'
import { formTransition } from '@/lib/animations'
import { useIsClient } from '@/hooks/useIsClient'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// Downloaded the first time it is opened, not with the page.
const ForgotPasswordModal = dynamic(() => import('@/components/forgot-password-modal/ForgotPasswordModal'), { loading: () => null })

const fromRight = { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 60 } }
const fromLeft  = { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } }
const SLIDE_T   = { duration: 0.32, ease: 'easeOut' as const }
/** Tailwind's `lg`, where the page changes from the phone layout to the two halves. */
const WIDE = '(min-width: 1024px)'

/**
 * The sign-in and register page. `wantsRegister` opens it on the register form,
 * for the landing button; `steam` is Steam's sign-in coming back
 * (api/auth/steam/callback), and takes the sign-in slot. `form` takes it too, for another
 * screen that wears the same layout (the reset-password page). `next` is the own-site path the
 * proxy sent the visitor from, already checked by `safeNext`: the sign-in says so and goes back to it.
 */
export default function AuthPage({ wantsRegister, steam, form, next = null }: { wantsRegister: boolean; steam: string | null; form?: ReactNode; next?: string | null }) {
  const [isLogin, setIsLogin] = useState(!wantsRegister)
  const [hasRegister, setHasRegister] = useState(false)
  // Held here, above the phone / desktop switch: the form under it unmounts when the window crosses `lg`, and the dialog (open, with the typed email) must not.
  const [forgotOpen, setForgotOpen] = useState(false)

  // Both layouts are in the page (CSS shows one), but the forms mount in the one in use only, so there is
  // one form with one state. Until the browser can say which, both hold it, as the server printed them.
  const isClient = useIsClient()
  const isWide = useMediaQuery(WIDE)
  const inPhone = !isClient || !isWide
  const inDesktop = !isClient || isWide
  const signInForm = form ?? (steam ? <SteamSignupForm outcome={steam} /> : <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} next={next} onForgot={() => setForgotOpen(true)} />)
  const registerForm = <RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setHasRegister} />

  return (
    <div data-theme="dark" className="relative bg-bg-main text-text-main min-h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">

      {/* Phone: a band of covers, the name, then the form on its card. */}
      <AuthPhoneFrame>
        <AnimatePresence mode="wait" initial={false}>
          {isLogin ? (
            <motion.div key="m-login" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <AuthFormCard>
                {inPhone && signInForm}
              </AuthFormCard>
            </motion.div>
          ) : (
            <motion.div key="m-register" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <AuthFormCard>
                {inPhone && registerForm}
              </AuthFormCard>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthPhoneFrame>

      {/* Desktop, left: the sign-in form or the art wall. */}
      <div className="hidden lg:flex flex-col relative lg:w-[42%] px-10 h-full">
        <AnimatePresence mode="wait" initial={false}>
          {isLogin ? (
            <motion.div key="d-login" className="relative w-full h-full" {...fromLeft} transition={SLIDE_T}>
              <AuthDesktopFormPanel>
                {inDesktop && signInForm}
              </AuthDesktopFormPanel>
            </motion.div>
          ) : (
            <motion.div key="d-collage-l" className="absolute inset-0" {...fromLeft} transition={SLIDE_T}>
              <AuthCollagePanel wall />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop, right: the art wall or the register form. */}
      <div className="hidden lg:flex flex-col relative lg:w-[58%] h-full">
        <AnimatePresence mode="wait" initial={false}>
          {isLogin ? (
            <motion.div key="d-collage-r" className="absolute inset-0" {...fromRight} transition={SLIDE_T}>
              <AuthCollagePanel wall />
            </motion.div>
          ) : (
            <motion.div key="d-register" className="relative z-10 w-full h-full" {...fromRight} transition={SLIDE_T}>
              <AuthDesktopFormPanel>
                {inDesktop && registerForm}
              </AuthDesktopFormPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signing up hands over data: what happens to it is one click away. */}
      <div className="relative pb-6 lg:pb-0 lg:absolute lg:bottom-4 lg:inset-x-0 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto text-xs bg-bg-main/80 backdrop-blur px-3 py-1.5 rounded-full border border-ink/10">
          <LegalLinks />
        </div>
      </div>
      <LazyWhenOpened open={forgotOpen}>
        <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
      </LazyWhenOpened>
    </div>
  )
}
