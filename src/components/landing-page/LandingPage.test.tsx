import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingPage from './LandingPage'
import { en } from '@/translations/en'

test('opens on the title screen: the name is the one h1, with the platforms and the line under it', () => {
  render(<LandingPage />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CheevoVault')
  expect(screen.getByText(en.landing.tagline)).toBeInTheDocument()
  expect(screen.getByText(en.landing.intro)).toBeInTheDocument()
})

test('offers both ways in, in the sticky bar, on the title screen and at the end, pointing at the auth page', () => {
  render(<LandingPage />)
  const create = screen.getAllByRole('link', { name: en.landing.createAccount })
  const signIn = screen.getAllByRole('link', { name: en.landing.signIn })
  expect(create).toHaveLength(3)
  expect(signIn).toHaveLength(3)
  for (const link of create) expect(link).toHaveAttribute('href', '/authPage?mode=register')
  for (const link of signIn) expect(link).toHaveAttribute('href', '/authPage')
})

test('says what the app is in its sections, each titled, with no closing card', () => {
  render(<LandingPage />)
  for (const title of [en.landing.libraryTitle, en.landing.organiseTitle, en.landing.achievementsTitle, en.landing.progressTitle, en.landing.pointsTitle, en.publicPages.faqTitle, en.landing.closingTitle]) {
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  }
})

test('every example is labelled as one', () => {
  render(<LandingPage />)
  expect(screen.getAllByText(en.landing.example)).toHaveLength(5)
})

test('the questions are all open, in the page, as the JSON-LD lists them', () => {
  render(<LandingPage />)
  const faq = screen.getByRole('heading', { level: 2, name: en.publicPages.faqTitle }).closest('section')!
  for (const item of en.landing.faq) {
    expect(within(faq).getByText(item.q).tagName).toBe('DT')
    expect(within(faq).getByText(item.a)).toBeVisible()
  }
})

test('the stop button holds all the page\'s motion still, and says so', async () => {
  const { container } = render(<LandingPage />)
  const stop = screen.getByRole('button', { name: en.landing.stopMotion })
  expect(stop).toHaveAttribute('aria-pressed', 'false')
  expect(container.firstElementChild).not.toHaveAttribute('data-motion')
  await userEvent.click(stop)
  expect(stop).toHaveAttribute('aria-pressed', 'true')
  expect(container.firstElementChild).toHaveAttribute('data-motion', 'still')
})

test('links the rankings, how points work and the questions, the public pages and the legal ones; no Xbox anywhere', () => {
  const { container } = render(<LandingPage />)
  expect(screen.getAllByRole('link', { name: en.rankings.title })[0]).toHaveAttribute('href', '/rankings')
  expect(screen.getByRole('link', { name: en.rankings.how })).toHaveAttribute('href', '/rankings/how')
  expect(screen.getByRole('link', { name: en.publicPages.faqTitle })).toHaveAttribute('href', '#faq')
  expect(screen.getByRole('link', { name: en.landing.whatIs })).toHaveAttribute('href', '#que-es')
  expect(screen.getByRole('link', { name: 'CheevoVault vs Exophase' })).toHaveAttribute('href', '/compare/exophase')
  expect(screen.getByRole('link', { name: en.privacy.link })).toBeInTheDocument()
  expect(container).not.toHaveTextContent(/xbox/i)
})

test('the art is decoration, hidden from assistive tech', () => {
  const { container } = render(<LandingPage />)
  const art = Array.from(container.querySelectorAll('img')).filter((img) => img.closest('[aria-hidden="true"]'))
  expect(art.length).toBeGreaterThan(20)
  for (const img of art) expect(img).toHaveAttribute('alt', '')
})

test('each part says what the feature does, in points', () => {
  render(<LandingPage />)
  for (const point of [...en.landing.libraryPoints, ...en.landing.organisePoints, ...en.landing.achievementsPoints, ...en.landing.progressPoints, ...en.landing.pointsPoints]) {
    expect(screen.getByText(point)).toBeInTheDocument()
  }
})
