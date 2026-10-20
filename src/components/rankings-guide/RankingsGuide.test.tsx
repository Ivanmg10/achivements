import { render, screen } from '@testing-library/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import { es } from '@/translations/es'
import { vaultGuideText } from '@/translations/vaultGuide'
import { exampleScores } from '@/utils/vaultExamples'
import RankingsGuide from './RankingsGuide'

test('explains the system, with the real numbers of the formula', () => {
  render(<RankingsGuide />)
  const g = vaultGuideText('en')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(g.heading)
  expect(screen.getByRole('link', { name: g.back })).toHaveAttribute('href', '/rankings')
  // Rarity: ten times rarer is worth one more time, up to four.
  expect(screen.getByRole('row', { name: '10 % ×2.0' })).toBeInTheDocument()
  expect(screen.getByRole('row', { name: '≤ 0.1 % ×4.0' })).toBeInTheDocument()
  // The examples come from the formula itself.
  expect(screen.getByText(exampleScores().quick.toLocaleString('en'))).toBeInTheDocument()
  // Every rank, from level 1 to 90.
  for (const name of Object.values(en.rankings.tiers)) expect(screen.getAllByText(`· ${name}`).length).toBeGreaterThan(0)
  expect(screen.getByText(g.faq[0].q)).toBeInTheDocument()
})

test('in Spanish when the viewer reads Spanish, in English otherwise', () => {
  ;(useLanguage as jest.Mock).mockReturnValueOnce({ lang: 'es', T: es, setLang: jest.fn() })
  render(<RankingsGuide />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vaultGuideText('es').heading)
  expect(vaultGuideText('ja')).toBe(vaultGuideText('en'))
})
