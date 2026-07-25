'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  IconX,
  IconPlayerPlay,
  IconHeart,
  IconCheck,
  IconFolder,
  IconListDetails,
  IconChevronDown,
} from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

interface MobileNavModalProps {
  isOpen: boolean
  onClose: () => void
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15 } },
}

export default function MobileNavModal({ isOpen, onClose }: MobileNavModalProps) {
  const { T } = useLanguage()
  const [statusOpen, setStatusOpen] = useState(false)

  const statusItems = [
    { href: '/playing', label: T.mainPage.playing, icon: IconPlayerPlay },
    { href: '/wantToPlay', label: T.mainPage.wantToPlay, icon: IconHeart },
    { href: '/completed', label: T.mainPage.completed, icon: IconCheck },
  ]
  const groupsItem = { href: '/groups', label: T.groups.title, icon: IconFolder }
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const isStatusActive = statusItems.some(({ href }) => pathname === href)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) setStatusOpen(false)
  }, [isOpen])

  const handleNavigate = (href: string) => {
    if (!session) {
      router.push('/authPage')
    } else {
      router.push(href)
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/5"
              variants={contentVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
                <span className="text-sm font-medium text-text-main">Menú</span>
                <button
                  onClick={onClose}
                  aria-label="Close menu"
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors"
                >
                  <IconX className="w-5 h-5" aria-hidden />
                </button>
              </div>

              {/* Nav items */}
              <motion.ul
                className="py-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                <motion.li variants={itemVariants}>
                  <button
                    onClick={() => setStatusOpen((o) => !o)}
                    aria-expanded={statusOpen}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left cursor-pointer ${
                      isStatusActive
                        ? 'bg-bg-main text-accent'
                        : 'text-text-secondary hover:text-text-main hover:bg-bg-main/60'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <IconListDetails className="w-5 h-5 shrink-0" aria-hidden />
                      <span className="text-sm font-medium">{T.header.status}</span>
                    </span>
                    <IconChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence>
                    {statusOpen && (
                      <motion.ul
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                      >
                        {statusItems.map(({ href, label, icon: Icon }) => {
                          const isActive = pathname === href
                          return (
                            <motion.li key={href} variants={itemVariants}>
                              <button
                                onClick={() => handleNavigate(href)}
                                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 transition-colors text-left cursor-pointer ${
                                  isActive
                                    ? 'bg-bg-main text-accent'
                                    : 'text-text-secondary hover:text-text-main hover:bg-bg-main/60'
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                                <span className="text-sm">{label}</span>
                              </button>
                            </motion.li>
                          )
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <button
                    onClick={() => handleNavigate(groupsItem.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer ${
                      pathname === groupsItem.href
                        ? 'bg-bg-main text-accent'
                        : 'text-text-secondary hover:text-text-main hover:bg-bg-main/60'
                    }`}
                  >
                    <IconFolder className="w-5 h-5 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">{groupsItem.label}</span>
                  </button>
                </motion.li>
              </motion.ul>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}