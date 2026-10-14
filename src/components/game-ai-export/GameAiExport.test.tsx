import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GameAiExport from './GameAiExport'
import { en } from '@/translations/en'
import type { AiExportSource } from '@/utils/aiExport'

const SOURCE: AiExportSource = {
  platform: 'psn',
  game: { title: 'Black Ops II', console: 'PS3' },
  achievements: [
    { name: 'Pending one', description: 'Do it', earned: false, earnedAt: null, rarityPercent: 3 },
    { name: 'Done one', description: 'Did it', earned: true, earnedAt: '2026-01-01T00:00:00Z', rarityPercent: 50 },
  ],
}

const writeText = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(navigator, { clipboard: { writeText } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => (console.error as jest.Mock).mockRestore())

function open() {
  const getSource = jest.fn(() => SOURCE)
  render(<GameAiExport getSource={getSource} />)
  return getSource
}

test('builds the export only when the window opens', () => {
  const getSource = open()
  expect(getSource).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  expect(getSource).toHaveBeenCalledTimes(1)
  const dialog = screen.getByRole('dialog', { name: en.aiExport.title })
  expect(dialog).toHaveTextContent('Black Ops II')
  expect(dialog).toHaveTextContent(en.aiExport.privacy)
})

test("copies the instructions and the data, with the player's question, and says so", async () => {
  open()
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  fireEvent.change(screen.getByLabelText(en.aiExport.questionLabel), { target: { value: 'How do I get the pending one?' } })
  writeText.mockResolvedValue(undefined)
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.copy }))

  expect(await screen.findByRole('status')).toHaveTextContent(en.aiExport.copied)
  const text = writeText.mock.calls[0][0] as string
  expect(text).toContain('The player asks: "How do I get the pending one?"')
  expect(text).toContain('Reply in English.')
  expect(text).toContain('"name": "Pending one"')
})

test('a copy that fails says so where the player is, and points to the download', async () => {
  open()
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  writeText.mockRejectedValue(new Error('denied'))
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.copy }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.aiExport.copyFailed)
})

test('downloads the .json under the game name', () => {
  const createObjectURL = jest.fn(() => 'blob:x')
  const revokeObjectURL = jest.fn()
  Object.assign(URL, { createObjectURL, revokeObjectURL })
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('black-ops-ii-psn-ai.json')
    expect(this.href).toBe('blob:x')
  })

  open()
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.download }))

  expect(click).toHaveBeenCalled()
  const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0]
  expect(blob.type).toBe('application/json')
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
  click.mockRestore()
})

test('closes with its button and with Escape', async () => {
  open()
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  fireEvent.click(screen.getByRole('button', { name: en.aiExport.close }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

  fireEvent.click(screen.getByRole('button', { name: en.aiExport.open }))
  fireEvent.keyDown(document, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})
