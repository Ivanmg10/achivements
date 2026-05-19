'use client'

import LoginUserForm from '@/components/login-user-form/LoginUserForm'
import RegisterUserForm from '@/components/register-user-form/RegisterUserForm'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formTransition } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'

const fromRight = { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 60 } }
const fromLeft  = { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } }
const SLIDE_T   = { duration: 0.32, ease: 'easeOut' as const }

function AuthBrand() {
  const { T } = useLanguage()
  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold text-text-main tracking-tight">{T.authPage.brand}</h1>
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/25 font-medium">RetroAchievements</span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-bg-tertiary text-text-secondary border border-white/10 font-medium">Steam · coming soon</span>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [hasRegister, setHasRegister] = useState(false)

  return (
    <div className="bg-bg-main text-text-main h-screen overflow-hidden flex">

      {/* ── Mobile ── */}
      <div className="lg:hidden flex-1 flex items-center justify-center relative px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.18] pointer-events-none select-none">
          <AuthCollagePanel />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-bg-main/80 via-bg-main/20 to-bg-main/80 pointer-events-none" />
        <div className="absolute top-12 left-0 right-0 flex justify-center pointer-events-none z-10">
          <AuthBrand />
        </div>
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="m-login" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
            </motion.div>
          ) : (
            <motion.div key="m-register" className="relative z-10 w-full" variants={formTransition} initial="hidden" animate="visible" exit="exit">
              <RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setHasRegister} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop izquierda: login form ↔ collage ── */}
      <div className="hidden lg:flex flex-col relative lg:w-[42%] px-10 h-full">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="d-login" className="relative w-full h-full" {...fromLeft} transition={SLIDE_T}>
              <div className="absolute top-12 left-0 right-0 flex justify-center">
                <AuthBrand />
              </div>
              <div className="h-full flex items-center justify-center">
                <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
              </div>
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
              <div className="absolute top-12 left-0 right-0 flex justify-center">
                <AuthBrand />
              </div>
              <div className="h-full flex items-center justify-center">
                <RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setHasRegister} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
