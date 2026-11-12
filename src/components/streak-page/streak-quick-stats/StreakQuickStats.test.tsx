import { render, screen } from '@testing-library/react'
import StreakQuickStats from './StreakQuickStats'

const lang = { current: 'es' }
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: jest.requireActual(`@/translations/${lang.current}`)[lang.current], lang: lang.current }),
}))

const stats = (daysSinceLast: number | null) => render(<StreakQuickStats activeDays={40} avgStreak={3} daysSinceLast={daysSinceLast} longestGap={9} />)

test('the days since the last achievement: the label, the number big and the unit under it, like the others', () => {
  lang.current = 'es'
  stats(1)
  const label = screen.getByText('Desde el último logro')
  expect(label.nextElementSibling).toHaveTextContent(/^1$/)
  expect(label.nextElementSibling?.nextElementSibling).toHaveTextContent(/^día$/)
})

test('in English, with the plural unit', () => {
  lang.current = 'en'
  stats(12)
  const label = screen.getByText('Since your last achievement')
  expect(label.nextElementSibling).toHaveTextContent(/^12$/)
  expect(label.nextElementSibling?.nextElementSibling).toHaveTextContent(/^days$/)
})

test('today still says the streak is alive', () => {
  lang.current = 'es'
  stats(0)
  expect(screen.getByText('Hoy')).toBeInTheDocument()
  expect(screen.getByText('sigue viva')).toBeInTheDocument()
})
