import { render, screen } from '@testing-library/react'
import MainPageProfileActions from './MainPageProfileActions'
import { en } from '@/translations/en'

const refreshButton = () => screen.queryByRole('button', { name: en.profileRa.refreshData })

test('the link out is always there, opening a new tab safely', () => {
  render(<MainPageProfileActions href="https://x.test/u" linkLabel="View on X" ringClass="r" />)
  const link = screen.getByRole('link', { name: 'View on X' })
  expect(link).toHaveAttribute('href', 'https://x.test/u')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

test('no refresh button without a refresh to run (another user page)', () => {
  render(<MainPageProfileActions href="https://x.test/u" linkLabel="View on X" ringClass="r" />)
  expect(refreshButton()).not.toBeInTheDocument()
})

test('the refresh button sits beside the link when there is one', () => {
  render(<MainPageProfileActions href="https://x.test/u" linkLabel="View on X" ringClass="r" onRefresh={jest.fn()} />)
  expect(refreshButton()).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View on X' })).toBeInTheDocument()
})
