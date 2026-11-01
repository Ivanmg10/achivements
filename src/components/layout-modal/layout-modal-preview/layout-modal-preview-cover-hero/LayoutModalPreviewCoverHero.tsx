'use client'

import { motion } from 'framer-motion'
import { buttonClass } from '@/components/ui/Button'
import { FadeImage } from '@/components/ui/FadeImage'
import { SAMPLE_LEAD_ID, sampleHero, type SampleGame } from '../layout-modal-preview-sample'

const SETTLE = { duration: 0.3, delay: 0.2 }

/** The big game-on-top block of the sample home in its cover layout. It grows out of the game's card (`SAMPLE_LEAD_ID`). */
export default function LayoutModalPreviewCoverHero({ game, kicker, open }: { game: SampleGame; kicker: string; open: string }) {
  return (
    <motion.div layoutId={SAMPLE_LEAD_ID} className="relative isolate flex h-44 shrink-0 flex-col items-start justify-end gap-1.5 overflow-hidden rounded-card p-5 @2xl:h-56">
      <FadeImage src={sampleHero(game)} alt="" fill sizes="56rem" className="absolute! inset-0 -z-20" imgClassName="h-full w-full object-cover object-[50%_30%]" />
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-black/90 to-black/20" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SETTLE} className="flex flex-col items-start gap-1.5">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/80">{kicker}</span>
        <span className="font-display italic font-extrabold text-3xl leading-none text-white pr-2 @2xl:text-4xl">{game.title}</span>
        <span className={buttonClass('primary', 'sm', 'mt-1')}>{open}</span>
      </motion.span>
    </motion.div>
  )
}
