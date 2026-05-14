'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { modalOverlay, modalContent } from '@/lib/animations'

export default function CommonModal({
  isOpen,
  onClose,
  children,
  className = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className={`bg-bg-header rounded-2xl p-6 w-full max-w-md text-text-main min-h-100 flex flex-col justify-center gap-5 ${className}`}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}