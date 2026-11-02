import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import WelcomePagePrivacySample from './WelcomePagePrivacySample'

const sample = (over: Partial<Parameters<typeof WelcomePagePrivacySample>[0]> = {}) =>
  render(<WelcomePagePrivacySample profilePublic showPresence showInRankings rank={19} {...over} />)

beforeEach(() => {
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', T: en })
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'ana' } } })
})

test('public: the card, with the dot, and the place in the rankings', () => {
  sample()
  expect(screen.getByText('ana')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: en.following.online })).toBeInTheDocument()
  expect(screen.getByText('#19')).toBeInTheDocument()
  expect(screen.getByText(en.rankings.showInRankingsOn)).toBeInTheDocument()
})

test('with presence off the dot goes', () => {
  sample({ showPresence: false })
  expect(screen.queryByRole('img', { name: en.following.online })).not.toBeInTheDocument()
})

test('out of the rankings, no place', () => {
  sample({ showInRankings: false })
  expect(screen.queryByText('#19')).not.toBeInTheDocument()
  expect(screen.getByText(en.rankings.showInRankingsOff)).toBeInTheDocument()
})

test('with nothing scored yet, no place either', () => {
  sample({ rank: 0 })
  expect(screen.queryByText('#0')).not.toBeInTheDocument()
  expect(screen.getByText(en.rankings.showInRankingsOn)).toBeInTheDocument()
})

test('a private profile shows no card and is not listed, whatever the rankings switch says', () => {
  sample({ profilePublic: false })
  expect(screen.getByText(en.welcome.privacy.privateTitle)).toBeInTheDocument()
  expect(screen.queryByText('ana')).not.toBeInTheDocument()
  expect(screen.getByText(en.rankings.showInRankingsOff)).toBeInTheDocument()
})
