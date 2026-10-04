import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import GroupDetailHeader from './GroupDetailHeader'
import type { GameGroup } from '@/types/types'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))
jest.mock('@/components/groups/group-icon-display/GroupIconDisplay', () => ({ __esModule: true, default: () => null }))

const group = { id: 1, title: 'Octubre', description: 'Para este mes', icon: null, is_public: false } as GameGroup

function setup(over = {}) {
  const props = { onAdd: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn(), onGridCols: jest.fn(), ...over }
  render(<GroupDetailHeader group={group} gameCount={3} summary={{ earned: 86, total: 182 }} gridCols={1} {...props} />)
  return props
}

test('title, privacy in words, description and the whole group’s progress', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'Octubre' })).toBeInTheDocument()
  expect(screen.getByText(en.groups.private)).toBeInTheDocument()
  expect(screen.getByText('Para este mes')).toBeInTheDocument()
  expect(screen.getByText(/86 of 182 achievements/)).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '47')
})

test('each action is a labelled button', () => {
  const props = setup()
  fireEvent.click(screen.getByRole('button', { name: en.groups.addGame }))
  fireEvent.click(screen.getByRole('button', { name: en.groups.editGroup }))
  fireEvent.click(screen.getByRole('button', { name: en.groups.deleteGroup }))
  expect(props.onAdd).toHaveBeenCalled()
  expect(props.onEdit).toHaveBeenCalled()
  expect(props.onDelete).toHaveBeenCalled()
})
