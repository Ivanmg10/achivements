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

test('in the viewer language, all nine of them', () => {
  ;(useLanguage as jest.Mock).mockReturnValueOnce({ lang: 'es', T: es, setLang: jest.fn() })
  render(<RankingsGuide />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(vaultGuideText('es').heading)
  for (const lang of ['de', 'fr', 'it', 'ja', 'pl', 'pt', 'ru'] as const) expect(vaultGuideText(lang).heading).not.toBe(vaultGuideText('en').heading)
})

test('a signed-out visitor never reads Xbox while it is admin-only (V3-15)', () => {
  const { container } = render(<RankingsGuide />)
  expect(container.textContent).not.toMatch(/xbox/i)
  for (const lang of ['en', 'es', 'de', 'fr', 'it', 'ja', 'pl', 'pt', 'ru'] as const) {
    const { example, ...rest } = vaultGuideText(lang)
    expect(JSON.stringify({ ...rest, example: { ...example, platforms: undefined } })).not.toMatch(/xbox/i)
  }
})

test('its parts are topics, not steps: no numbers, the rules a plain list, "Beta" only in the question (#130)', () => {
  const { container } = render(<RankingsGuide />)
  expect(screen.queryByText(/^0\d$/)).not.toBeInTheDocument()
  // The rules are a bulleted list, not boxes with a coloured stripe.
  expect(container.querySelector('li[class*="before:"]')).toBeNull()
  expect(container.querySelector('ul.list-disc')).toBeInTheDocument()
  // The little tag and the note in a box are gone; the question that says what can change stays.
  expect(screen.queryByText(en.rankings.beta)).not.toBeInTheDocument()
  expect(screen.getAllByText(/beta/i)).toHaveLength(1)
})
