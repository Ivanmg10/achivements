'use client'

import { useState } from 'react'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Modal from '@/components/ui/Modal'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import UserFontPreference from '@/components/user-page/user-font-preference/UserFontPreference'
import UserShapePreference from '@/components/user-page/user-shape-preference/UserShapePreference'
import UserHomeLayoutPreference from '@/components/user-page/user-home-layout-preference/UserHomeLayoutPreference'
import UserGameCardPreference from '@/components/user-page/user-game-card-preference/UserGameCardPreference'
import LayoutModalPreview from './layout-modal-preview/LayoutModalPreview'

type Part = 'page' | 'home'
const ID = 'layout'

/**
 * Where the site's look is chosen: a sample home follows every choice live on
 * the left, and the options live in a side panel (under the sample on a
 * phone). Page holds the shape and font, Home the home layout and game cards.
 * Each choice is kept the moment it is made; the dialog only closes.
 */
export default function LayoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [part, setPart] = useState<Part>('page')
  const ids = tabIds(ID, part)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={T.homeLayout.layoutLabel} hint={T.homeLayout.modalHint} icon={<IconLayoutDashboard size={20} />} className="gap-0">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-0">
        <div className="min-w-0 lg:pr-6">
          <LayoutModalPreview />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:border-l lg:border-ink/[0.08] lg:pl-6">
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
              <>
                <UserShapePreference />
                <UserFontPreference />
              </>
            ) : (
              <>
                <UserHomeLayoutPreference />
                <UserGameCardPreference />
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
