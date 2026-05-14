jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue({ user: {} }) }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

jest.mock('@/components/main-footer/MainFooter', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}))

jest.mock('@/components/main-header/MainHeader', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}))

jest.mock('@/components/ra-user-refresher/RaUserRefresher', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/main-providers/MainProviders', () => ({
  MainProviders: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { render, screen } from '@testing-library/react'
import MainLayout from './layout'

test('renders children and footer', async () => {
  const layout = await MainLayout({ children: <p>Page Content</p> })
  render(layout as React.ReactElement)
  expect(screen.getByText('Page Content')).toBeInTheDocument()
  expect(screen.getByTestId('footer')).toBeInTheDocument()
})
