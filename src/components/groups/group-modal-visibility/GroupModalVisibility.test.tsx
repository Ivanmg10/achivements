import { fireEvent, render, screen } from '@testing-library/react'
import GroupModalVisibility from './GroupModalVisibility'
import { en } from '@/translations/en'

test('two options that say who sees the group', () => {
  const onChange = jest.fn()
  render(<GroupModalVisibility isPublic={false} onChange={onChange} />)
  const priv = screen.getByRole('radio', { name: new RegExp(en.groups.privateHint) })
  const pub = screen.getByRole('radio', { name: new RegExp(en.groups.publicHint) })
  expect(priv).toBeChecked()
  fireEvent.click(pub)
  expect(onChange).toHaveBeenCalledWith(true)
})
