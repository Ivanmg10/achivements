'use client'

import LoginUserForm from '@/components/login-user-form/LoginUserForm'
import RegisterUserForm from '@/components/register-user-form/RegisterUserForm'
import LegalLinks from '@/components/legal-links/LegalLinks'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import AuthBrand from '@/components/auth-brand/AuthBrand'
import AuthFormCard from '@/components/auth-form-card/AuthFormCard'
import AuthDesktopFormPanel from '@/components/auth-desktop-form-panel/AuthDesktopFormPanel'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { formTransition } from '@/lib/animations'

const fromRight = { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 60 } }
const fromLeft  = { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } }
const SLIDE_T   = { duration: 0.32, ease: 'easeOut' as const }

/** ?mode=register opens straight on the register form, for the landing button. */
function AuthPageContent() {
  const wantsRegister = useSearchParams().get('mode') === 'register'
  const [isLogin, setIsLogin] = useState(!wantsRegister)
  const [hasRegister, setHasRegister] = useState(false)

  return (
    <div className="relative bg-bg-main text-text-main min-h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">

      {/* ── Mobile: the art wall behind, the form on a frosted card over it ── */}
      <div className="lg:hidden flex-1 relative flex flex-col items-center justify-center gap-6 px-4 pt-10 pb-4">
        <div aria-hidden="true" className="fixed inset-0 opacity-30 pointer-events-none select-none">
          <AuthCollagePanel />
        </div>
        <div aria-hidden="true" className="fixed inset-0 bg-linear-to-b from-bg-main/90 via-bg-main/40 to-bg-main/90 pointer-events-none" />
        <div className="relative z-10">
          <AuthBrand />
        </div>
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="m-login" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <AuthFormCard>
                <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
              </AuthFormCard>
            </motion.div>
          ) : (
            <motion.div key="m-register" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <AuthFormCard>
                <RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setHasRegister} />
              </AuthFormCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop izquierda: login form ↔ collage ── */}
      <div className="hidden lg:flex flex-col relative lg:w-[42%] px-10 h-full">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="d-login" className="relative w-full h-full" {...fromLeft} transition={SLIDE_T}>
              <AuthDesktopFormPanel>
                <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
              </AuthDesktopFormPanel>
            </motion.div>
          ) : (
            <motion.div key="d-collage-l" className="absolute inset-0" {...fromLeft} transition={SLIDE_T}>
              <AuthCollagePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop derecha: collage ↔ register form ── */}
      <div className="hidden lg:flex flex-col relative lg:w-[58%] h-full">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="d-collage-r" className="absolute inset-0" {...fromRight} transition={SLIDE_T}>
              <AuthCollagePanel />
            </motion.div>
          ) : (
            <motion.div key="d-register" className="relative z-10 w-full h-full" {...fromRight} transition={SLIDE_T}>
              <AuthDesktopFormPanel>
                <RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setHasRegister} />
              </AuthDesktopFormPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signing up hands over data: what happens to it is one click away. */}
      <div className="relative pb-6 lg:pb-0 lg:absolute lg:bottom-4 lg:inset-x-0 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto text-xs bg-bg-main/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
          <LegalLinks />
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  )
}
