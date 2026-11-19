'use client'

import { IconCircleCheck, IconCircleDashed, IconCircleHalf2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { PsnStepState, PsnSyncSteps } from '@/utils/psnSyncStage'

const ORDER = ['trophies', 'library', 'playtime', 'history'] as const

/** Each state has its own shape and its word for screen readers: never the colour alone. */
const ICON: Record<PsnStepState, { Icon: typeof IconCircleCheck; tone: string }> = {
  done: { Icon: IconCircleCheck, tone: 'text-success' },
  active: { Icon: IconCircleHalf2, tone: 'text-accent' },
  waiting: { Icon: IconCircleDashed, tone: 'text-text-secondary' },
}

/** The four parts of a PSN sync (#180): trophies, library, play time, history, each done, in progress or waiting. */
export default function MainPageProfilePsnSyncSteps({ steps }: { steps: PsnSyncSteps }) {
  const { T } = useLanguage()
  const copy = T.psn.sync
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.8125rem]">
      {ORDER.map((key) => {
        const { Icon, tone } = ICON[steps[key]]
        return (
          <li key={key} className={`flex items-center gap-1.5 ${steps[key] === 'waiting' ? 'text-text-secondary' : 'text-text-main'}`}>
            <Icon size={16} className={`shrink-0 ${tone}`} aria-hidden="true" />
            <span>
              {copy.steps[key]}
              <span className="sr-only">{`: ${copy.stepState[steps[key]]}`}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
