import { loadMessages } from './load'
import { LANGUAGES } from '@/utils/languages'
import type { Lang } from '@/utils/languages'

/** Every string of a language, with the path it lives at. */
function strings(node: unknown, path = ''): [string, string][] {
  if (typeof node === 'string') return [[path, node]]
  if (Array.isArray(node)) return node.flatMap((v, i) => strings(v, `${path}[${i}]`))
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
  return []
}

const ids = LANGUAGES.map((l) => l.id)
let all: Record<Lang, Awaited<ReturnType<typeof loadMessages>>>
beforeAll(async () => {
  all = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await loadMessages(id)]))) as typeof all
})

describe('the copy rules that CLAUDE.md and the audit (#122) set', () => {
  test('no em dash in the live strings, in any language but Russian (its dash is punctuation there)', () => {
    for (const id of ids.filter((i) => i !== 'ru')) {
      const found = strings(all[id]).filter(([, v]) => v.includes('—')).map(([k]) => `${id}:${k}`)
      expect(found).toEqual([])
    }
  })

  test('RetroAchievements is connected, never signed in to: one name in every place and language', () => {
    for (const id of ids) {
      const T = all[id]
      expect(T.raLoginModal.title).toBe(T.userData.connectRA)
      expect(T.profileRa.connect).toBe(T.userData.connectRA)
      expect(T.raLoginModal.connect).toBe(T.userData.connect)
    }
  })

  test('the three places that say "not started" say it the same way', () => {
    for (const id of ids) {
      const T = all[id]
      expect(T.search.wantToPlay).toBe(T.categories.wantToPlay)
      expect(T.mainPage.wantToPlay).toBe(T.categories.wantToPlay)
    }
  })

  test('Spanish calls the game list "biblioteca" and spells "sesión" with its accent', () => {
    const found = strings(all.es).filter(([, v]) => /librería|sesion\b/i.test(v)).map(([k]) => k)
    expect(found).toEqual([])
  })

  test('the rank names are not the masculine person nouns that the audit found', () => {
    const banned = ['Novato', 'Cazador', 'Veterano', 'Experto', 'Maestro', 'Novizio', 'Cacciatore', 'Neuling', 'Jäger', 'Chasseur', 'Apprenti', 'Nowicjusz', 'Łowca', 'Новичок', 'Охотник']
    for (const id of ids) expect(Object.values(all[id].rankings.tiers).filter((t) => banned.includes(t))).toEqual([])
  })

  test('the rank names are the owner's (2026-11-11): Padawan everywhere, Spanish as chosen, no two alike', () => {
    const es = Object.values(all.es.rankings.tiers)
    expect(es).toEqual(['Padawan', 'Aspirante', 'Cazatrofeos', 'Especialista', 'Eco oscuro', 'Élite', 'Maestría', 'Leyenda'])
    for (const id of ids) {
      const names = Object.values(all[id].rankings.tiers)
      expect(names[0]).toBe('Padawan')
      expect(new Set(names).size).toBe(names.length)
    }
  })

  test('the landing does not count accounts: it has three platforms', () => {
    for (const id of ids) expect(all[id].landing.progressText).not.toMatch(/both accounts|dos cuentas|beiden Konten|deux comptes|entrambi|両方|obu kontach|duas contas|обоих/)
  })
})
