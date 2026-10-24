import type { ReactNode } from 'react'
import { IconEyeOff, IconFlame, IconFolder, IconPinFilled, IconTrophy } from '@tabler/icons-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircularProgress } from '@/components/ui/CircularProgress'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { STEP_SKY } from '@/components/welcome-page/welcomeArt'

/*
 * Drawn sketches of each of the intro's points, in the theme's colours: shapes
 * where the app has text (so they read in any language) and made-up numbers.
 * Decorative: the text beside them says what they show. Real screenshots can
 * replace any of them later without touching the rest.
 */

const CARD = 'rounded-2xl bg-bg-card ring-1 ring-ink/[0.06]'
const ARTS = [STEP_SKY.ra, STEP_SKY.steam, STEP_SKY.psn, 'linear-gradient(135deg, rgb(var(--accent)), #f0abfc)']

function Bar({ w, strong = false }: { w: string; strong?: boolean }) {
  return <span className={`block h-2.5 rounded-full ${strong ? 'bg-ink/20' : 'bg-ink/10'}`} style={{ width: w }} />
}

function Library() {
  const rows = [
    { art: ARTS[0], w: '58%', pct: 72, rare: true },
    { art: ARTS[1], w: '44%', pct: 100 },
    { art: ARTS[2], w: '66%', pct: 35 },
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[<RaLogo key="ra" height={11} />, <SteamLogo key="st" size={14} className="text-[#66c0f4]" />, <PlaystationLogo key="ps" size={14} className="text-[#0070d1]" />].map((logo, i) => (
          <span key={i} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full ring-1 ring-inset ${i === 1 ? 'ring-ink/40 bg-ink/5' : 'ring-ink/10'}`}>
            {logo}
            <span className="block w-8 h-2 rounded-full bg-ink/15" />
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`${CARD} flex items-center gap-3 p-3`}>
          <span className="w-12 h-12 rounded-xl shrink-0" style={{ background: row.art }} />
          <span className="flex-1 flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <Bar w={row.w} strong />
              {row.rare && <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded-md bg-[#e5b53f]/20 text-[#e5b53f]">0.8%</span>}
            </span>
            <ProgressBar pct={row.pct} label="" />
          </span>
          <span className={`w-10 text-right text-xs font-semibold ${row.pct === 100 ? 'text-success' : 'text-text-secondary'}`}>{row.pct}%</span>
        </div>
      ))}
      <div className={`${CARD} flex items-center gap-3 p-3 opacity-40`}>
        <span className="w-12 h-12 rounded-xl shrink-0 bg-ink/10 flex items-center justify-center text-text-secondary">
          <IconEyeOff size={18} />
        </span>
        <Bar w="40%" />
      </div>
    </div>
  )
}

function Collect() {
  return (
    <div className="flex flex-col gap-3">
      <div className={`${CARD} flex items-center gap-3 p-3`}>
        <span className="w-14 h-14 rounded-xl shrink-0" style={{ background: ARTS[1] }} />
        <span className="flex-1 flex flex-col gap-2"><Bar w="60%" strong /><ProgressBar pct={64} label="" /></span>
        <IconPinFilled size={18} className="text-accent shrink-0" />
      </div>
      <div className={`${CARD} flex items-center gap-3 p-3`}>
        <span className="relative w-14 h-14 shrink-0">
          {ARTS.slice(0, 3).map((art, i) => (
            <span key={i} className="absolute w-10 h-10 rounded-lg ring-2 ring-bg-card" style={{ background: art, left: i * 6, top: i * 4 }} />
          ))}
        </span>
        <span className="flex-1 flex flex-col gap-2"><span className="flex items-center gap-2 text-text-secondary"><IconFolder size={16} /><Bar w="45%" strong /></span><Bar w="30%" /></span>
      </div>
      <div className={`${CARD} p-3 flex flex-col gap-2.5`}>
        <span className="flex items-center gap-2 text-accent"><IconTrophy size={16} /><Bar w="35%" strong /></span>
        <span className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="aspect-square rounded-xl ring-2 ring-accent/30" style={{ background: ARTS[i % ARTS.length] }} />
          ))}
        </span>
      </div>
    </div>
  )
}

function Streak() {
  // A made-up year: steadier towards the end, as a streak builds.
  const cells = Array.from({ length: 7 * 22 }, (_, i) => {
    const week = Math.floor(i / 7)
    const v = (Math.sin(i * 12.9898) * 43758.5453) % 1
    const level = Math.abs(v) * (0.45 + week / 30)
    return level > 0.85 ? 4 : level > 0.6 ? 3 : level > 0.4 ? 2 : level > 0.22 ? 1 : 0
  })
  const shade = ['bg-ink/[0.07]', 'bg-accent/25', 'bg-accent/45', 'bg-accent/70', 'bg-accent']
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className={`${CARD} flex-1 p-3 flex items-center gap-2.5`}>
          <IconFlame size={22} className="text-warning" />
          <span className="font-display italic font-extrabold text-3xl leading-none">45</span>
          <Bar w="30%" />
        </div>
        <div className={`${CARD} flex-1 p-3 flex items-center gap-2.5`}>
          <IconTrophy size={20} className="text-text-secondary" />
          <span className="font-display italic font-extrabold text-3xl leading-none text-text-secondary">72</span>
          <Bar w="30%" />
        </div>
      </div>
      <div className={`${CARD} p-3`}>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {cells.map((level, i) => (
            <span key={i} className={`aspect-square rounded-[3px] ${shade[level]}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Points() {
  const rows = [
    { place: 1, w: '50%', vp: '116,456', you: false },
    { place: 2, w: '40%', vp: '98,210', you: true },
    { place: 3, w: '56%', vp: '71,904', you: false },
  ]
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
      <div className={`${CARD} p-4 flex flex-col items-center justify-center gap-2`}>
        <CircularProgress earned={68} total={100} size={104} center={<span className="font-display italic font-extrabold text-3xl">12</span>} ariaLabel="" />
        <Bar w="70px" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.place} className={`${CARD} flex items-center gap-3 p-3 ${row.you ? 'ring-accent/50' : ''}`}>
            <span className={`w-6 text-center font-display italic font-extrabold text-xl ${row.place === 1 ? 'text-[#e5b53f]' : 'text-text-secondary'}`}>{row.place}</span>
            <span className="w-8 h-8 rounded-full shrink-0 bg-ink/15" />
            <span className="flex-1"><Bar w={row.w} strong /></span>
            <span className="text-xs font-bold tabular-nums">{row.vp} <span className="text-text-secondary font-medium">VP</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Friends() {
  const friends = [
    { online: true, art: ARTS[1], w: '55%' },
    { online: true, art: ARTS[2], w: '42%' },
    { online: false, art: ARTS[0], w: '60%' },
  ]
  return (
    <div className="flex flex-col gap-3">
      {friends.map((f, i) => (
        <div key={i} className={`${CARD} flex items-center gap-3 p-3`}>
          <span className="relative w-11 h-11 shrink-0">
            <span className="block w-11 h-11 rounded-full bg-ink/15" />
            {f.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success ring-[3px] ring-bg-card" />}
          </span>
          <span className="flex-1 flex flex-col gap-2"><Bar w="38%" strong /><Bar w={f.w} /></span>
          <span className="w-10 h-10 rounded-lg shrink-0" style={{ background: f.art }} />
        </div>
      ))}
      <div className={`${CARD} p-3 flex items-center gap-3`}>
        <span className="flex-1 flex flex-col gap-1.5"><Bar w="30%" /><ProgressBar pct={64} label="" /></span>
        <span className="font-display italic font-extrabold text-lg text-text-secondary">vs</span>
        <span className="flex-1 flex flex-col gap-1.5"><Bar w="30%" /><ProgressBar pct={41} label="" /></span>
      </div>
    </div>
  )
}

const ART: ReactNode[] = [<Library key="0" />, <Collect key="1" />, <Streak key="2" />, <Points key="3" />, <Friends key="4" />]

/** The sketch for the intro's point `index` (0–4). */
export default function WelcomePageIntroArt({ index }: { index: number }) {
  return (
    <div aria-hidden="true" inert className="pointer-events-none select-none">
      {ART[index] ?? null}
    </div>
  )
}
