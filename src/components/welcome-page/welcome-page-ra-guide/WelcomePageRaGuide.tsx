import { IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const RA_SETTINGS = 'https://retroachievements.org/settings'
const STEP_CLASS = [styles.step1, styles.step2, styles.step3]

/**
 * Where RetroAchievements keeps the Web API key, which is what stops most
 * people: three numbered steps that light up in turn while a cursor walks a
 * sketch of RA's settings (Settings → Keys → Copy), and the link straight to
 * them in a new tab. The sketch is decorative and hidden on narrow screens;
 * the steps say the same in words.
 */
export default function WelcomePageRaGuide() {
  const { T } = useLanguage()
  const t = T.welcome.ra

  return (
    <div className={`${styles.card} rounded-3xl bg-bg-card ring-1 ring-ink/[0.06] p-4 sm:p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">{t.guideTitle}</h2>
        <a
          href={RA_SETTINGS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 min-h-10 px-2 -mr-2 rounded-xl text-sm font-semibold text-text-main hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {t.openRa}
          <IconExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {t.guide.map((line, i) => (
          <li key={line} className={`${STEP_CLASS[i]} flex sm:flex-col gap-2 sm:gap-0.5 p-2.5 rounded-xl bg-bg-main text-[0.8125rem] leading-snug`}>
            <span aria-hidden="true" className="font-display italic font-extrabold text-xl leading-none text-[#e5b53f]">{i + 1}</span>
            {line}
          </li>
        ))}
      </ol>

      <div aria-hidden="true" className="hidden sm:block relative w-[460px] max-w-full h-[290px] rounded-2xl overflow-hidden bg-[#17181e] ring-1 ring-[#2a2c3a] text-[#e1e4eb]">
        <div className="h-10 flex items-center gap-2 px-3 bg-[#1d1e27] border-b border-[#2a2c3a]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3a3d4c]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#3a3d4c]" />
          <span className="flex-1 ml-2 h-5.5 rounded-md bg-[#0f1014] text-[0.6875rem] text-[#8c919b] flex items-center px-2.5">retroachievements.org</span>
          <span className={`${styles.settings} px-2.5 py-1 rounded-md text-xs`}>Settings</span>
        </div>
        <div className={`${styles.page} absolute inset-x-0 top-10 bottom-0 flex`}>
          <div className="w-32 px-2.5 py-4 flex flex-col gap-1.5 border-r border-[#2a2c3a] text-xs">
            <span className="px-2.5 py-2 rounded-lg text-[#a3a8b3]">Profile</span>
            <span className="px-2.5 py-2 rounded-lg text-[#a3a8b3]">Preferences</span>
            <span className={`${styles.keysItem} px-2.5 py-2 rounded-lg`}>Keys</span>
          </div>
          <div className={`${styles.keys} flex-1 p-5 flex flex-col gap-3`}>
            <span className="font-bold text-sm">Keys</span>
            <span className="text-xs text-[#a3a8b3]">Web API Key</span>
            <div className="flex gap-2 items-center">
              <span className="flex-1 h-9 rounded-lg bg-[#0f1014] ring-1 ring-inset ring-[#2a2c3a] flex items-center px-2.5 font-mono text-[#c9ccd4]">••••••••••••</span>
              <span className="h-9 px-3 rounded-lg bg-[#2a2c3a] flex items-center text-xs">Copy</span>
            </div>
            <span className={`${styles.copied} text-xs text-[#e5b53f]`}>{t.guideCopied}</span>
          </div>
        </div>
        <div className={`${styles.cursor} absolute left-0 top-0 w-6 h-6`}>
          <span className={`${styles.click} absolute -left-2.5 -top-2.5 w-8 h-8 rounded-full bg-[#e5b53f]/60`} />
          <svg width="22" height="22" viewBox="0 0 24 24" className="absolute left-0 top-0">
            <path d="M4 3l7 17 2.5-7L21 10z" fill="#ffffff" stroke="#0f1014" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <p className="hidden sm:block text-xs text-text-secondary">{t.guideNote}</p>
    </div>
  )
}
