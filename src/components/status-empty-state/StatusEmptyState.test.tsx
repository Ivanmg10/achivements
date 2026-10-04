import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import StatusEmptyState from './StatusEmptyState'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en }) }))

test('says what each list is for and how it fills up, with an icon instead of an emoji', () => {
  const { container } = render(<StatusEmptyState category="completed" />)
  expect(screen.getByText(en.categoryPage.noCompleted)).toBeInTheDocument()
  expect(screen.getByText(en.categoryPage.noCompletedSub)).toBeInTheDocument()
  expect(container.querySelector('svg')).not.toBeNull()
})

test('an unknown list falls back to "playing"', () => {
  render(<StatusEmptyState category="nope" />)
  expect(screen.getByText(en.categoryPage.noPlaying)).toBeInTheDocument()
})
