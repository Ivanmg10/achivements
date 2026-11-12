import { render, screen } from '@testing-library/react'
import StreakQuickStats from './StreakQuickStats'

const lang = { current: 'es' }
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: jest.requireActual(`@/translations/${lang.current}`)[lang.current], lang: lang.current }),
}))

const stats = (daysSinceLast: number | null) => render(<StreakQuickStats activeDays={40} avgStreak={3} daysSinceLast={daysSinceLast} longestGap={9} />)

test('the last achievement says how long ago, in the reader\'s language', () => {
  lang.current = 'es'
  stats(1)
  expect(screen.getByText('Último logro').nextElementSibling).toHaveTextContent(/^hace 1 día$/)
})

test('in English the words come after the number', () => {
  lang.current = 'en'
  stats(12)
  expect(screen.getByText('Last achievement').nextElementSibling).toHaveTextContent(/^12 days ago$/)
})

test('today still says the streak is alive', () => {
  lang.current = 'es'
  stats(0)
  expect(screen.getByText('Hoy')).toBeInTheDocument()
  expect(screen.getByText('sigue viva')).toBeInTheDocument()
})
