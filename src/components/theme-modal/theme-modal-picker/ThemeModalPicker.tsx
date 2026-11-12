import { useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import { BASES, isAccent, optionsOf, pairOf, pickBase, type Base, type Option } from '@/utils/themePicker'
import ChoiceCards from '@/components/ui/ChoiceCards'
import ThemeScreen from '@/components/ui/ThemeScreen'

/**
 * Every theme as a base (Dark, Tinted, Light, Special) and an option under it (#135): an accent on the
 * coloured bases, the palettes beside the accents of their ground, the tributes under Special. Each
 * option is a small screen of the theme it lands on, and the base and option of the theme on are
 * checked. A pick hands over the card it came from, for the theme to spread from there.
 */
export default function ThemeModalPicker({ theme, onSelect }: { theme: Theme; onSelect: (theme: Theme, from: Element) => void }) {
  const { T } = useLanguage()
  const from = useRef<Element | null>(null)
  const t = T.userTheme
  const { base, option } = pairOf(theme)

  function pick(id: Theme) {
    if (from.current) onSelect(id, from.current)
  }

  function label(o: Option) {
    if (!isAccent(o)) return t[`name_${o}`]
    if (o === 'mono') return base === 'light' ? t.accent_black : t.accent_white
    return t[`accent_${o}`]
  }

  const screen = (id: Theme) => <ThemeScreen theme={id} on={id === theme} />

  return (
    // The capture sees the radio before ChoiceCards reports it: its card is where the theme spreads from.
    <div className="flex flex-col gap-5" onChangeCapture={(e) => (from.current = (e.target as Element).closest('label'))}>
      <ChoiceCards<Base>
        legend={t.base}
        value={base}
        columns={4}
        onChange={(b) => pick(pickBase(b, option))}
        options={BASES.map((b) => ({ value: b, label: t[`base_${b}`], preview: screen(pickBase(b, option)) }))}
      />
      <ChoiceCards<Theme>
        legend={base === 'special' ? t.theme : t.accent}
        value={theme}
        columns={7}
        onChange={pick}
        options={optionsOf(base).map((o) => ({ value: o.theme, label: label(o.option), preview: screen(o.theme) }))}
      />
    </div>
  )
}
