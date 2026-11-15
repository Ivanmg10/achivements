jest.mock('@/hooks/usePsnVerification', () => ({ usePsnVerification: jest.fn() }))
// The dialog is a dynamic import: stand it in with one that only says whether it is open.
jest.mock('next/dynamic', () => () => function DialogStub({ isOpen }: { isOpen: boolean }) {
  return isOpen ? <div role="dialog" aria-label="verify" /> : null
})

import { fireEvent, render, screen } from '@testing-library/react'
import PsnVerification from './PsnVerification'
import { usePsnVerification } from '@/hooks/usePsnVerification'
import { en } from '@/translations/en'

const V = en.psn.verification

function setHook(overrides: Record<string, unknown> = {}) {
  ;(usePsnVerification as jest.Mock).mockReturnValue({ linked: true, verified: false, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
})

test('nothing without a linked account', () => {
  setHook({ linked: false })
  const { container } = render(<PsnVerification onlineId={null} />)
  expect(container).toBeEmptyDOMElement()
})

test('not verified: one line, the state in words and a button that opens the dialog', () => {
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.getByText(V.unverified)).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: V.verify }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('the card never asks for a code: only the open dialog does', () => {
  render(<PsnVerification onlineId="Hakoom" />)
  expect(usePsnVerification).toHaveBeenCalledWith({ active: false })
})

test('verified: says so in words, with nothing to press', () => {
  setHook({ verified: true })
  render(<PsnVerification onlineId="Hakoom" />)
  expect(screen.getByText(V.verified)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
