'use client'

import { IconEyeOff, IconTrophy } from '@tabler/icons-react'
import CommonModal from '../common-modal/CommonModal'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import PsnPreferenceChoice from './psn-preference-choice/PsnPreferenceChoice'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

/** PlayStation preferences: what counts as completed, and whether hidden trophies start out shown. */
export default function PsnPreferencesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [platinum, setPlatinum] = usePsnPlatinumCompletes()
  const [reveal, setReveal] = usePsnRevealHidden()

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="mx-4 sm:max-w-xl max-h-[90dvh] overflow-y-auto justify-start!">
      <h2 className="text-xl font-bold flex items-center gap-2.5">
        <PlaystationLogo size={22} className="text-[#0070d1]" aria-hidden="true" />
        {T.userData.psnSection}
      </h2>
      <div className="flex flex-col gap-3">
        <PsnPreferenceChoice
          icon={<IconTrophy size={18} />}
          title={T.userData.psnPlatinum}
          current={platinum}
          onChoose={setPlatinum}
          options={[
            { value: false, label: T.userData.psnPlatinumOff },
            { value: true, label: T.userData.psnPlatinumOn },
          ]}
        />
        <PsnPreferenceChoice
          icon={<IconEyeOff size={18} />}
          title={T.userData.psnHiddenTrophies}
          current={reveal}
          onChoose={setReveal}
          options={[
            { value: false, label: T.userData.psnHiddenConceal },
            { value: true, label: T.userData.psnHiddenReveal },
          ]}
        />
      </div>
    </CommonModal>
  )
}
