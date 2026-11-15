import { render, screen } from '@testing-library/react'
import AuthFormSkeleton from './AuthFormSkeleton'
import { en } from '@/translations/en'

test('announces what it was told, or that the page is loading', () => {
  const { rerender } = render(<AuthFormSkeleton label="Checking" />)
  expect(screen.getByRole('status', { name: 'Checking' })).toHaveAttribute('aria-busy', 'true')
  rerender(<AuthFormSkeleton />)
  expect(screen.getByRole('status', { name: en.loadingPage.title })).toBeInTheDocument()
})
