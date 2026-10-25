'use client'

import { useState } from 'react'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Modal from '@/components/ui/Modal'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import UserShapePreference from '@/components/user-page/user-shape-preference/UserShapePreference'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'
import UserGameCardPreference from '@/components/user-page/user-game-card-preference/UserGameCardPreference'

type Part = 'page' | 'home'
const ID = 'layout'

/**
 * Where the site's layout is chosen, so the preferences card keeps its height:
 * on the Page tab the shape of the controls, bars and tags (slanted or round),
 * which every page follows; on the Home tab the home's layout (classic or
 * cover) and how game cards are drawn. Each choice is kept the moment it is
 * made; the dialog only closes.
 */
export default function LayoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [part, setPart] = useState<Part>('page')
  const ids = tabIds(ID, part)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={T.homeLayout.layoutLabel} hint={T.homeLayout.modalHint} icon={<IconLayoutDashboard size={20} />} className="gap-5">
      <Tabs<Part>
        id={ID}
        aria-label={T.homeLayout.layoutLabel}
        value={part}
        onChange={setPart}
        tabs={[
          { value: 'page', label: T.homeLayout.tabPage },
          { value: 'home', label: T.homeLayout.tabHome },
        ]}
      />
      <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} className="flex flex-col gap-6">
        {part === 'page' ? (
          <UserShapePreference />
        ) : (
          <>
            <UserHomeLayoutPreference />
            <UserGameCardPreference />
          </>
        )}
      </div>
    </Modal>
  )
}
