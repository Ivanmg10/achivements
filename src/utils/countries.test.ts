import { countryName } from './countries'

test('a country is named in the language of the reader', () => {
  expect(countryName('ES', 'es')).toBe('España')
  expect(countryName('ES', 'en')).toBe('Spain')
})

test('a code no one knows falls back to itself', () => {
  expect(countryName('Q1', 'en')).toBe('Q1')
})

import { searchCountries } from './countries'

describe('searchCountries', () => {
  test('lists every country named and sorted in the reader\'s language', () => {
    const es = searchCountries('', 'es')
    expect(es.find((c) => c.code === 'DE')?.name).toBe('Alemania')
    expect(es[0].name.localeCompare(es[1].name, 'es')).toBeLessThan(0)
    expect(es.map((c) => c.name)).toEqual([...es.map((c) => c.name)].sort((a, b) => a.localeCompare(b, 'es')))
  })

  test('matches the translated name, the English name and the code, ignoring case and accents', () => {
    expect(searchCountries('alemania', 'es').map((c) => c.code)).toEqual(['DE'])
    expect(searchCountries('Germany', 'es').map((c) => c.code)).toEqual(['DE'])
    expect(searchCountries('de', 'es').some((c) => c.code === 'DE')).toBe(true)
    expect(searchCountries('espana', 'es').map((c) => c.code)).toContain('ES')
  })

  test('nothing matches nothing', () => {
    expect(searchCountries('zzzzzz', 'en')).toEqual([])
  })
})
