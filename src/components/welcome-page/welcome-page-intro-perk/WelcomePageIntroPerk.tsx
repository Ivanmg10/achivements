import { useId } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * One of the intro's numbered points: its title and one line, and, opened,
 * what it really is in a few sentences. The whole head is the button
 * (`aria-expanded`); closed, the detail is `inert`, so neither the keyboard
 * nor a screen reader lands in it. It grows by its row, not by a jump.
 */
export default function WelcomePageIntroPerk({
  number,
  title,
  text,
  detail,
  open,
  onToggle,
  delayMs,
}: {
  number: number
  title: string
  text: string
  detail: string
  open: boolean
  onToggle: () => void
  delayMs: number
}) {
  const id = useId()

  return (
    <li
      className={`${styles.card} rounded-2xl bg-bg-card ring-1 transition-shadow ${open ? 'ring-accent/40' : 'ring-ink/[0.06]'}`}
      style={{ animationDelay: `calc(var(--enter-delay, 0s) + ${delayMs}ms)` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="group w-full flex items-center gap-3.5 p-3.5 text-left rounded-2xl hover:bg-ink/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-lg">
          {number}
        </span>
        <span className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-[15px]">{title}</span>
          <span className="text-[13px] text-text-secondary">{text}</span>
        </span>
        <IconChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-text-secondary group-hover:text-text-main transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={id}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className={`pl-[4.25rem] pr-4 pb-4 text-sm leading-relaxed text-text-secondary transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
            {detail}
          </p>
        </div>
      </div>
    </li>
  )
}
