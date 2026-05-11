import { render, screen } from '@testing-library/react'
import MainPageProfileSt from './MainPageProfileSt'

test('renders Steam section', () => {
  render(<MainPageProfileSt />)
  expect(screen.getByText('Steam')).toBeInTheDocument()
})

test('renders Steam sign in link', () => {
  render(<MainPageProfileSt />)
  expect(screen.getByText('Sign in with Steam')).toBeInTheDocument()
})
