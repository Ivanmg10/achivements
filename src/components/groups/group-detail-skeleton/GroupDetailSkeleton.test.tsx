import { render, screen } from '@testing-library/react'
import GroupDetailSkeleton from './GroupDetailSkeleton'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en }) }))

test('announced once as loading, the shapes hidden from screen readers', () => {
  const { container } = render(<GroupDetailSkeleton />)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
})
