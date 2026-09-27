import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import NotFound from './not-found'

test('says the page does not exist and links home', () => {
  render(
    <LanguageProvider>
      <NotFound />
    </LanguageProvider>,
  )
  expect(screen.getByRole('heading', { name: en.notFound.title })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.notFound.home })).toHaveAttribute('href', '/')
})
