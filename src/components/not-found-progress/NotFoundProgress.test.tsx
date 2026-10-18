import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import NotFoundProgress from './NotFoundProgress'

test('shows 0 of 1, an empty bar and the rarity', () => {
  render(
    <LanguageProvider>
      <NotFoundProgress />
    </LanguageProvider>,
  )
  expect(screen.getByText('0 / 1')).toBeInTheDocument()
  const bar = screen.getByRole('progressbar', { name: en.notFound.progress })
  expect(bar).toHaveAttribute('aria-valuenow', '0')
  expect(bar.querySelector('[data-fill]')).toBeNull()
  expect(screen.getByText(en.notFound.rarity)).toBeInTheDocument()
  expect(screen.getByText(en.notFound.rarityValue)).toBeInTheDocument()
})
