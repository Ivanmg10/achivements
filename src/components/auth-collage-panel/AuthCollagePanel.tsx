'use client'

import { motion } from 'framer-motion'

const ALL_IMAGES = [
  'https://media.retroachievements.org/Images/122047.png',
  'https://media.retroachievements.org/Images/097499.png',
  'https://media.retroachievements.org/Images/107150.png',
  'https://media.retroachievements.org/Images/109728.png',
  'https://media.retroachievements.org/Images/104482.png',
  'https://media.retroachievements.org/Images/061105.png',
  'https://media.retroachievements.org/Images/089222.png',
  'https://media.retroachievements.org/Images/109943.png',
  'https://media.retroachievements.org/Images/022051.png',
  'https://media.retroachievements.org/Images/095107.png',
  'https://media.retroachievements.org/Images/113279.png',
  'https://media.retroachievements.org/Images/112421.png',
  'https://media.retroachievements.org/Images/067087.png',
  'https://media.retroachievements.org/Images/106752.png',
  'https://media.retroachievements.org/Images/068336.png',
  'https://media.retroachievements.org/Images/064807.png',
  'https://media.retroachievements.org/Images/116501.png',
  'https://media.retroachievements.org/Images/124258.png',
  'https://media.retroachievements.org/Images/125487.png',
  'https://media.retroachievements.org/Images/112858.png',
  'https://media.retroachievements.org/Images/104260.png',
  'https://media.retroachievements.org/Images/105173.png',
  'https://media.retroachievements.org/Images/068144.png',
  'https://media.retroachievements.org/Images/114756.png',
  'https://media.retroachievements.org/Images/062373.png',
  'https://media.retroachievements.org/Images/103756.png',
  'https://media.retroachievements.org/Images/093950.png',
  'https://media.retroachievements.org/Images/100662.png',
  'https://media.retroachievements.org/Images/058558.png',
  'https://media.retroachievements.org/Images/122562.png',
  'https://media.retroachievements.org/Images/126558.png',
  'https://media.retroachievements.org/Images/071275.png',
  'https://media.retroachievements.org/Images/124487.png',
  'https://media.retroachievements.org/Images/052103.png',
  'https://media.retroachievements.org/Images/060426.png',
  'https://media.retroachievements.org/Images/104787.png',
  'https://media.retroachievements.org/Images/045842.png',
  'https://media.retroachievements.org/Images/089382.png',
]

// shuffle en client → cada carga muestra 20 imágenes distintas del pool de 33
function pickRandom(arr: string[], n: number): string[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

const GAME_IMAGES = pickRandom(ALL_IMAGES, 24)

// 5 rows × 4 cols — rows stagger ±5% so adjacent rows touch/overlap
// Math: row spacing = 18%, image height ≈ 11% → (base±5) creates true overlap between rows
const POSITIONS: { top: string; left: string; rotate: number; z: number }[] = [
  // Row 1  (base 0%)
  { top: '1%', left: '3%', rotate: -11, z: 3 },
  { top: '4%', left: '26%', rotate: 7, z: 5 },
  { top: '0%', left: '51%', rotate: -5, z: 1 },
  { top: '3%', left: '76%', rotate: 12, z: 4 },
  // Row 2  (base 18%, stagger pulls up to 14% → overlaps row 1 bottom ~12%)
  { top: '14%', left: '14%', rotate: 9, z: 4 },
  { top: '21%', left: '37%', rotate: -13, z: 1 },
  { top: '16%', left: '62%', rotate: 6, z: 3 },
  { top: '22%', left: '84%', rotate: -10, z: 2 },
  // Row 3  (base 36%, stagger → touches row 2 bottom ~33%)
  { top: '33%', left: '5%', rotate: -7, z: 2 },
  { top: '39%', left: '28%', rotate: 11, z: 4 },
  { top: '35%', left: '53%', rotate: -9, z: 5 },
  { top: '40%', left: '78%', rotate: 5, z: 1 },
  // Row 4  (base 54%, stagger → touches row 3 bottom ~51%)
  { top: '50%', left: '16%', rotate: 13, z: 5 },
  { top: '56%', left: '40%', rotate: -6, z: 2 },
  { top: '52%', left: '65%', rotate: 10, z: 4 },
  { top: '57%', left: '87%', rotate: -8, z: 3 },
  // Row 5  (base 72%, stagger → touches row 4 bottom ~68%)
  { top: '68%', left: '8%', rotate: -9, z: 1 },
  { top: '74%', left: '31%', rotate: 8, z: 3 },
  { top: '70%', left: '56%', rotate: -12, z: 2 },
  { top: '75%', left: '80%', rotate: 6, z: 5 },
  // Row 6  (base 90%, partially cut off — intentional)
  { top: '87%', left: '20%', rotate: -8, z: 3 },
  { top: '91%', left: '44%', rotate: 6, z: 2 },
  { top: '88%', left: '68%', rotate: -11, z: 4 },
  { top: '92%', left: '89%', rotate: 9, z: 1 },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.55, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function AuthCollagePanel() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-card">
      {/* subtle accent glow behind images */}
      <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-bg-secondary/60" />

      {/* blend edges into form bg */}
      <div className="absolute inset-y-0 left-0 w-10 z-20 bg-linear-to-r from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 z-20 bg-linear-to-l from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-12 z-20 bg-linear-to-b from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 z-20 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />

      <motion.div
        className="relative w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="absolute"
            style={{ top: pos.top, left: pos.left, zIndex: pos.z }}
          >
            <div style={{ transform: `rotate(${pos.rotate}deg)` }}>
              <div className="bg-bg-tertiary p-1.5 rounded-xl shadow-2xl border border-white/10 hover:scale-110 hover:shadow-accent/25 transition-all duration-200">
                <img
                  src={GAME_IMAGES[i]}
                  alt=""
                  aria-hidden="true"
                  className="w-24 h-24 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
