jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn() }))
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

import { render, screen } from '@testing-library/react'
import RaKeyInvalidNotice from './RaKeyInvalidNotice'
import { useGamesData } from '@/context/GamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { usePathname } from 'next/navigation'
import { en } from '@/translations/en'

function setup({ keyInvalid = true, subject = null as string | null, pathname = '/' } = {}) {
  ;(useGamesData as jest.Mock).mockReturnValue({ keyInvalid })
  ;(useSubject as jest.Mock).mockReturnValue(subject)
  ;(usePathname as jest.Mock).mockReturnValue(pathname)
}

test('says RA refuses the key, with a way to the account page', () => {
  setup()
  render(<RaKeyInvalidNotice />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userPage.raKeyInvalid)
  expect(screen.getByRole('link', { name: en.userPage.raKeyInvalidAction })).toHaveAttribute('href', '/user')
})

test('on the account page itself there is no link to it', () => {
  setup({ pathname: '/user' })
  render(<RaKeyInvalidNotice />)
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('nothing when the key is fine, or on someone else’s page', () => {
  setup({ keyInvalid: false })
  const { container, rerender } = render(<RaKeyInvalidNotice />)
  expect(container).toBeEmptyDOMElement()
  setup({ subject: 'someone' })
  rerender(<RaKeyInvalidNotice />)
  expect(container).toBeEmptyDOMElement()
})
