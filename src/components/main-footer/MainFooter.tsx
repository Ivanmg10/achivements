'use client'

import { IconBrandGithub } from '@tabler/icons-react'
import Link from 'next/link'

export default function MainFooter() {
  return (
    <footer className="bg-bg-card border-t border-white/5 text-text-secondary text-xs">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

        <span className="font-semibold text-text-main tracking-wide">
          CheevoVault
          <span className="font-normal text-text-secondary ml-2">© 2025</span>
        </span>

        <div className="flex items-center gap-3">
          <span className="text-text-secondary/50">Powered by</span>
          <a
            href="https://retroachievements.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-accent transition-colors"
          >
            RetroAchievements
          </a>
          <span className="text-white/20">·</span>
          <span className="text-text-secondary/40 cursor-default" title="Coming soon">
            Steam
            <span className="ml-1 text-[10px] bg-white/5 text-text-secondary/50 px-1.5 py-0.5 rounded-full">soon</span>
          </span>
        </div>

        <Link
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors"
        >
          <IconBrandGithub size={14} />
          GitHub
        </Link>

      </div>
    </footer>
  )
}
