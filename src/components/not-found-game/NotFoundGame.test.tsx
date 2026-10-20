import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import NotFoundGame from './NotFoundGame'

const back = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ back, push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() })
})

const renderGame = (source: 'psn' | 'steam' | 'xbox') =>
  render(
    <LanguageProvider>
      <NotFoundGame source={source} />
    </LanguageProvider>,
  )

test('says the game was not found, naming its platform', () => {
  renderGame('psn')
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.gameTitle })).toBeInTheDocument()
  expect(screen.getByText(en.notFound.gameSubtitle.replace('{platform}', 'PlayStation'))).toBeInTheDocument()
})

test('leads to the library, or back', () => {
  const spy = jest.spyOn(window.history, 'length', 'get').mockReturnValue(3)
  renderGame('steam')
  expect(screen.getByRole('link', { name: en.notFound.library })).toHaveAttribute('href', '/playing')
  fireEvent.click(screen.getByRole('button', { name: en.notFound.back }))
  expect(back).toHaveBeenCalledTimes(1)
  spy.mockRestore()
})
