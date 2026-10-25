import { render, screen } from '@testing-library/react'
import HomeLayoutModal from './HomeLayoutModal'
import { en } from '@/translations/en'

test('names itself and offers both choices', () => {
  render(<HomeLayoutModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('dialog', { name: en.homeLayout.label })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: en.homeLayout.label })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: en.homeLayout.cardsLabel })).toBeInTheDocument()
})

test('closed, it draws nothing', () => {
  const { baseElement } = render(<HomeLayoutModal isOpen={false} onClose={jest.fn()} />)
  expect(baseElement.querySelector('[role="dialog"]')).toBeNull()
})
