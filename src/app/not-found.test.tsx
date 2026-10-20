import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import NotFound from './not-found'

test('shows the hidden-achievement 404, full screen', () => {
  render(
    <LanguageProvider>
      <NotFound />
    </LanguageProvider>,
  )
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument()
  expect(screen.getByRole('main')).toHaveClass('min-h-screen')
})
