import { fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import RouteErrorCard from './RouteErrorCard'

const writeText = jest.fn()

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

beforeEach(() => writeText.mockReset())

const renderCard = (digest?: string) =>
  render(
    <LanguageProvider>
      <RouteErrorCard digest={digest} />
    </LanguageProvider>,
  )

test('shows the load as interrupted, with the bar hidden from assistive tech', () => {
  renderCard()
  expect(screen.getByText(en.errorBoundary.interrupted)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).toBeNull()
})

test('without a digest there is no code to copy', () => {
  renderCard()
  expect(screen.queryByText(en.errorBoundary.code)).toBeNull()
  expect(screen.queryByRole('button', { name: en.errorBoundary.copy })).toBeNull()
})

test('copies the digest and says so', async () => {
  writeText.mockResolvedValue(undefined)
  renderCard('abc123')
  expect(screen.getByText('abc123')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.errorBoundary.copy }))
  expect(await screen.findByText(en.errorBoundary.copied)).toBeInTheDocument()
  expect(writeText).toHaveBeenCalledWith('abc123')
})

test('says so when the copy fails', async () => {
  writeText.mockRejectedValue(new Error('denied'))
  renderCard('abc123')
  fireEvent.click(screen.getByRole('button', { name: en.errorBoundary.copy }))
  expect(await screen.findByText(en.errorBoundary.copyFailed)).toBeInTheDocument()
})
