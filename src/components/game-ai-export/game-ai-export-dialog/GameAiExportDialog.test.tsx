import { fireEvent, render, screen } from '@testing-library/react'
import GameAiExportDialog from './GameAiExportDialog'
import { en } from '@/translations/en'
import type { AiExportSource } from '@/utils/aiExport'

const SOURCE = { game: { title: 'Zelda' }, platform: 'ra' } as unknown as AiExportSource

test('is a dialog named by its title, with what the file is for as its hint', () => {
  render(<GameAiExportDialog source={SOURCE} onClose={jest.fn()} />)
  const dialog = screen.getByRole('dialog', { name: en.aiExport.title })
  expect(dialog).toHaveTextContent(en.aiExport.intro.replace('{game}', 'Zelda'))
  expect(dialog).toHaveFocus()
})

test('Escape and its named corner button close it', () => {
  const onClose = jest.fn()
  render(<GameAiExportDialog source={SOURCE} onClose={onClose} />)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: en.cards.close }))
  expect(onClose).toHaveBeenCalledTimes(2)
})
