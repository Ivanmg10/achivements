'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { IconPlayerPlay, IconHeart, IconCheck, IconFolder, IconUsers, IconListDetails, IconTrophy, IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import Modal from '@/components/ui/Modal'

interface MobileNavModalProps {
  isOpen: boolean
  onClose: () => void
}

const itemClass = (active: boolean, inset: string) =>
  `w-full flex items-center gap-3 ${inset} transition-colors text-left cursor-pointer focus-ring ${
    active ? 'bg-bg-main text-accent' : 'text-text-secondary hover:text-text-main hover:bg-bg-main/60'
  }`

/** The phone's menu: a `Modal` near the top, with the library's three lists folded under one entry. */
export default function MobileNavModal({ isOpen, onClose }: MobileNavModalProps) {
  const { T } = useLanguage()
  const [statusOpen, setStatusOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const statusItems = [
    { href: '/wantToPlay', label: T.mainPage.wantToPlay, icon: IconHeart },
    { href: '/playing', label: T.mainPage.playing, icon: IconPlayerPlay },
    { href: '/completed', label: T.mainPage.completed, icon: IconCheck },
  ]
  const navItems = [
    { href: '/groups', label: T.groups.title, icon: IconFolder },
    { href: '/following', label: T.following.title, icon: IconUsers },
    { href: '/rankings', label: T.rankings.title, icon: IconTrophy },
  ]
  const isStatusActive = statusItems.some(({ href }) => pathname === href)

  // Closing folds the status list again; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (!isOpen) setStatusOpen(false)
  })

  const handleNavigate = (href: string) => {
    router.push(session ? href : '/authPage')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="top" title={T.header.menu} className="gap-0">
      <ul className="-mx-6">
        <li>
          <button type="button" onClick={() => setStatusOpen((o) => !o)} aria-expanded={statusOpen} className={`${itemClass(isStatusActive, 'px-6 py-3')} justify-between`}>
            <span className="flex items-center gap-3">
              <IconListDetails className="w-5 h-5 shrink-0" aria-hidden />
              <span className="text-sm font-medium">{T.header.status}</span>
            </span>
            <IconChevronDown className={`w-4 h-4 shrink-0 transition-transform ${statusOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {statusOpen && (
            <ul>
              {statusItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <button type="button" onClick={() => handleNavigate(href)} className={itemClass(pathname === href, 'pl-[3.25rem] pr-6 py-2.5')}>
                    <Icon className="w-4 h-4 shrink-0" aria-hidden />
                    <span className="text-sm">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <button type="button" onClick={() => handleNavigate(href)} className={itemClass(pathname === href, 'px-6 py-3')}>
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
