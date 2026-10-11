jest.mock('@/hooks/useRecentAchievements', () => ({ useRecentAchievements: () => ({ achievements: [] }) }))
jest.mock('@/components/search-modal/SearchModal', () => () => null)

import { fireEvent, render, screen } from '@testing-library/react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MainHeader from './MainHeader'
import { BackInterceptProvider } from '@/context/BackInterceptContext'
import { useBackIntercept } from '@/hooks/useBackIntercept'

/** A page that has a step to undo. */
function Page({ onBack }: { onBack: (() => void) | null }) {
  useBackIntercept(onBack)
  return null
}

const back = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null } } })
  ;(usePathname as jest.Mock).mockReturnValue('/playing')
  ;(useRouter as jest.Mock).mockReturnValue({ back, push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() })
})

afterEach(() => (usePathname as jest.Mock).mockReturnValue('/'))

test('back goes back in the history, as ever, when the page has nothing to undo', () => {
  render(<BackInterceptProvider><MainHeader /><Page onBack={null} /></BackInterceptProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(back).toHaveBeenCalledTimes(1)
})

test('back undoes the page\'s step instead of leaving it, when the page has one', () => {
  const undo = jest.fn()
  render(<BackInterceptProvider><MainHeader /><Page onBack={undo} /></BackInterceptProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(undo).toHaveBeenCalledTimes(1)
  expect(back).not.toHaveBeenCalled()
})

test('once the step is undone, the next back leaves the page', () => {
  const undo = jest.fn()
  const { rerender } = render(<BackInterceptProvider><MainHeader /><Page onBack={undo} /></BackInterceptProvider>)
  rerender(<BackInterceptProvider><MainHeader /><Page onBack={null} /></BackInterceptProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(back).toHaveBeenCalledTimes(1)
  expect(undo).not.toHaveBeenCalled()
})

test('without the provider (as a page outside the app\'s) back is the history\'s', () => {
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(back).toHaveBeenCalledTimes(1)
})
