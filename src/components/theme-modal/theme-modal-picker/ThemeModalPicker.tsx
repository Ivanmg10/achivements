import { useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import { ACCENTS, BASES, NAMED_THEMES, pairOf, pickAccent, pickBase, type Accent, type Base } from '@/utils/themePicker'
import ChoiceCards from '@/components/ui/ChoiceCards'
import ThemeScreen from '@/components/ui/ThemeScreen'

/**
 * Every theme, as drawn on the canvas (#135): the 14 basic ones as a base and an accent,
 * the 8 named ones whole, each option a small screen of the theme it lands on. A pick
 * hands over the card it came from, for the theme to spread from there. A pair with no
 * theme (tinted with white) keeps its place, dimmed and not offered. While a named theme
 * is on no base or accent is marked; an accent then goes on the dark base.
 */
export default function ThemeModalPicker({ theme, onSelect }: { theme: Theme; onSelect: (theme: Theme, from: Element) => void }) {
  const { T } = useLanguage()
  const from = useRef<Element | null>(null)
  const t = T.userTheme
  const pair = pairOf(theme)
  const mono = pair?.base === 'light' ? t.accent_black : t.accent_white

  function pick(id: Theme | null) {
    if (id && from.current) onSelect(id, from.current)
  }

  const screen = (id: Theme) => <ThemeScreen theme={id} on={id === theme} />

  return (
    // The capture sees the radio before ChoiceCards reports it: its card is where the theme spreads from.
    <div className="flex flex-col gap-5" onChangeCapture={(e) => (from.current = (e.target as Element).closest('label'))}>
      <ChoiceCards<Base | null>
        legend={t.base}
        value={pair?.base ?? null}
        columns={3}
        onChange={(base) => pick(pickBase(base!, pair?.accent))}
        options={BASES.map((base) => ({ value: base, label: t[`base_${base}`], preview: screen(pickBase(base, pair?.accent)) }))}
      />
      <ChoiceCards<Accent | null>
        legend={t.accent}
        value={pair?.accent ?? null}
        columns={5}
        onChange={(accent) => pick(pickAccent(pair?.base, accent!))}
        options={ACCENTS.map((accent) => {
          const id = pickAccent(pair?.base, accent)
          const name = accent === 'mono' ? mono : t[`accent_${accent}`]
          return id
            ? { value: accent, label: name, preview: screen(id) }
            : {
                value: accent,
                label: <>{name}<span className="sr-only">, {t.noPair}</span></>,
                disabled: true,
                preview: (
                  <span className="flex aspect-[16/10] items-center justify-center p-2 rounded-tile border border-dashed border-ink/20 text-center text-xs text-text-secondary">
                    {t.noPair}
                  </span>
                ),
              }
        })}
      />
      <ChoiceCards<Theme | null>
        legend={t.named}
        value={pair ? null : theme}
        columns={4}
        onChange={pick}
        options={NAMED_THEMES.map(({ id, kind }) => ({ value: id, label: t[`name_${id}`], hint: t[`kind_${kind}`], preview: screen(id) }))}
      />
    </div>
  )
}
