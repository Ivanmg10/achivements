'use client'

import { IconBrandGithub } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import LegalLinks from '@/components/legal-links/LegalLinks'

const REPO_URL = 'https://github.com/Ivanmg10/achivements'
const PLATFORMS = [
  { name: 'RetroAchievements', href: 'https://retroachievements.org' },
  { name: 'Steam', href: 'https://store.steampowered.com' },
]
const LINK = 'text-text-secondary hover:text-accent transition-colors'

export default function MainFooter() {
  const { T } = useLanguage()

  return (
    <footer className="bg-bg-card border-t border-white/5 text-text-secondary text-xs">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

        <span className="font-semibold text-text-main tracking-wide">
          CheevoVault
          <span className="font-normal text-text-secondary ml-2">© {new Date().getFullYear()}</span>
        </span>

        <div className="flex items-center gap-3">
          <span className="text-text-secondary/50">{T.mainFooter.poweredBy}</span>
          {PLATFORMS.map(({ name, href }, i) => (
            <span key={name} className="flex items-center gap-3">
              {i > 0 && <span className="text-white/20" aria-hidden="true">·</span>}
              <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>{name}</a>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LegalLinks />
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 ${LINK}`}>
            <IconBrandGithub size={14} aria-hidden="true" />
            GitHub
          </a>
        </div>

      </div>
    </footer>
  )
}
