const { en } = require('../../src/translations/en')

const useLanguage = jest.fn(() => ({
  lang: 'en',
  setLang: jest.fn(),
  T: en,
  fromBrowser: false,
}))

const LanguageProvider = ({ children }) => children

module.exports = { useLanguage, LanguageProvider }
