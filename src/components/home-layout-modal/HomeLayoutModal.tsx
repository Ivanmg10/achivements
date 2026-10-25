'use client'

import { IconLayoutDashboard } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Modal from '@/components/ui/Modal'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'
import UserGameCardPreference from '@/components/user-page/user-game-card-preference/UserGameCardPreference'

/**
 * Where the home's looks are chosen, so the preferences card keeps its height:
 * the layout (classic or cover) and how game cards are drawn. Each choice is
 * kept the moment it is made; the dialog only closes.
 */
export default function HomeLayoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={T.homeLayout.label} hint={T.homeLayout.modalHint} icon={<IconLayoutDashboard size={20} />} className="gap-6">
      <UserHomeLayoutPreference />
      <UserGameCardPreference />
    </Modal>
  )
}
