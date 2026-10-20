jest.mock('@/hooks/useXboxEnabled', () => ({ useXboxEnabled: jest.fn() }))

import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { LanguageProvider } from '@/context/LanguageContext'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { en } from '@/translations/en'
import NotFoundInApp from './NotFoundInApp'

const renderAt = (path: string, xbox = false) => {
  ;(usePathname as jest.Mock).mockReturnValue(path)
  ;(useXboxEnabled as jest.Mock).mockReturnValue(xbox)
  render(
    <LanguageProvider>
      <NotFoundInApp />
    </LanguageProvider>,
  )
}

afterEach(() => (usePathname as jest.Mock).mockReturnValue('/'))

test('a game page says the game was not found', () => {
  renderAt('/psnGame/NPWR20188_00')
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.gameTitle })).toBeInTheDocument()
})

test('any other page gets the hidden-achievement 404, under the header', () => {
  renderAt('/nope')
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument()
  expect(screen.queryByRole('main')).toBeNull()
})

test('an Xbox game page says nothing of Xbox to someone who cannot use it', () => {
  renderAt('/xboxGame/123')
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument()
  expect(screen.queryByText(/Xbox/)).toBeNull()
})

test('an Xbox game page names it for an admin', () => {
  renderAt('/xboxGame/123', true)
  expect(screen.getByText(en.notFound.gameSubtitle.replace('{platform}', 'Xbox'))).toBeInTheDocument()
})
