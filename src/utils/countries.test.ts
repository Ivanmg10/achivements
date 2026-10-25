import { countryName } from './countries'

test('a country is named in the language of the reader', () => {
  expect(countryName('ES', 'es')).toBe('España')
  expect(countryName('ES', 'en')).toBe('Spain')
})

test('a code no one knows falls back to itself', () => {
  expect(countryName('Q1', 'en')).toBe('Q1')
})
