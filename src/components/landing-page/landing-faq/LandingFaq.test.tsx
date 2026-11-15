import { render, screen } from '@testing-library/react'
import LandingFaq from './LandingFaq'
import { en } from '@/translations/en'

test('every question open, as a term and its answer, under the title the bar links to', () => {
  const { container } = render(<LandingFaq />)
  expect(container.querySelector('section')).toHaveAttribute('id', 'faq')
  expect(screen.getByRole('heading', { level: 2, name: en.publicPages.faqTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.faqLead)).toBeInTheDocument()
  for (const item of en.landing.faq) {
    expect(screen.getByText(item.q).tagName).toBe('DT')
    expect(screen.getByText(item.a).tagName).toBe('DD')
  }
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
