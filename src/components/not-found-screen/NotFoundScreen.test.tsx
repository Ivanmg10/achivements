import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import NotFoundScreen from './NotFoundScreen'

const back = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ back, push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() })
})

const renderScreen = (fullScreen?: boolean) =>
  render(
    <LanguageProvider>
      <NotFoundScreen fullScreen={fullScreen} />
    </LanguageProvider>,
  )

test('says the page does not exist and links home', () => {
  renderScreen()
  expect(screen.getByRole('heading', { level: 1, name: en.notFound.title })).toBeInTheDocument()
  expect(screen.getByText(en.notFound.subtitle)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.notFound.home })).toHaveAttribute('href', '/')
})

test('draws the 404 as a hidden achievement at 0 of 1', () => {
  renderScreen()
  expect(screen.getByText(en.notFound.eyebrow)).toBeInTheDocument()
  expect(screen.getByTestId('IconQuestionMark')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: en.notFound.progress })).toHaveAttribute('aria-valuenow', '0')
})

test('back goes back', () => {
  const spy = jest.spyOn(window.history, 'length', 'get').mockReturnValue(3)
  renderScreen()
  fireEvent.click(screen.getByRole('button', { name: en.notFound.back }))
  expect(back).toHaveBeenCalledTimes(1)
  spy.mockRestore()
})

test('inside the app it sits in the layout\'s <main>, not a second one', () => {
  renderScreen()
  expect(screen.queryByRole('main')).toBeNull()
})

test('full screen, it is the page\'s <main> and covers the whole height', () => {
  renderScreen(true)
  expect(screen.getByRole('main')).toHaveClass('min-h-screen')
})
