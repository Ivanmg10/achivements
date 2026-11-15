import { en } from './en'
import { es } from './es'
import { loadMessages } from './load'
import { LANGUAGES } from '@/utils/languages'

test('English is at hand, and another language comes from its own file', async () => {
  await expect(loadMessages('en')).resolves.toBe(en)
  await expect(loadMessages('es')).resolves.toBe(es)
})

test('every language the app offers can be loaded', async () => {
  for (const { id } of LANGUAGES) expect((await loadMessages(id)).landing.tagline).toBeTruthy()
})

test('every language can cross from the server to the client, so none holds a function', async () => {
  for (const { id } of LANGUAGES) {
    const messages = await loadMessages(id)
    expect(JSON.parse(JSON.stringify(messages))).toEqual(messages)
  }
})
