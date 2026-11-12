import { THEMES } from '@/types/types'
import { BASES, optionsOf, pairOf, pickBase } from './themePicker'

const offered = BASES.flatMap((base) => optionsOf(base).map((o) => o.theme))

test('every theme comes from exactly one base and option, and every option offered is a theme', () => {
  expect([...offered].sort()).toEqual([...THEMES].sort())
  expect(new Set(offered).size).toBe(offered.length)
})

test('the owner\'s table: the palettes join the base of their ground, the tributes are the special base', () => {
  expect(optionsOf('dark').map((o) => o.theme)).toEqual(['dark', 'dark-red', 'dark-green', 'dark-blue', 'dark-white'])
  expect(optionsOf('tinted').map((o) => o.theme)).toEqual(['purple', 'red', 'green', 'blue', 'crimson', 'midnight'])
  expect(optionsOf('light').map((o) => o.theme)).toEqual(['light', 'light-red', 'light-green', 'light-blue', 'light-black', 'sakura', 'arctic'])
  expect(optionsOf('special').map((o) => o.theme)).toEqual(['black-ops-2', 'snake-eater', 'steam-retro', 'venom'])
  // The options' row is seven wide (ChoiceCards columns={7}), so no base wraps it and changing base never moves the dialog.
  expect(Math.max(...BASES.map((b) => optionsOf(b).length))).toBe(7)
})

test('each theme gives back its own base and option', () => {
  for (const id of THEMES) expect(pickBase(pairOf(id).base, pairOf(id).option)).toBe(id)
  expect(pairOf('venom')).toEqual({ base: 'special', option: 'venom' })
  expect(pairOf('sakura')).toEqual({ base: 'light', option: 'sakura' })
  expect(pairOf('dark-white')).toEqual({ base: 'dark', option: 'mono' })
})

test('a base keeps the same option when it has it, else takes its first', () => {
  expect(pickBase('light', 'red')).toBe('light-red')
  expect(pickBase('light', 'mono')).toBe('light-black')
  expect(pickBase('tinted', 'mono')).toBe('purple')
  expect(pickBase('dark', 'crimson')).toBe('dark')
  expect(pickBase('special', 'violet')).toBe('black-ops-2')
})
