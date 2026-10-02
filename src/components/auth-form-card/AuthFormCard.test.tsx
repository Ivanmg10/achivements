import { render, screen } from '@testing-library/react'
import AuthFormCard from './AuthFormCard'

test('wraps the form it is given', () => {
  render(
    <AuthFormCard>
      <form aria-label="Sign in" />
    </AuthFormCard>,
  )
  expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument()
})
