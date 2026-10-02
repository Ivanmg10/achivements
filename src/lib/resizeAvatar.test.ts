import { AvatarReadError, resizeToAvatar } from './resizeAvatar'

let decodeOk = true
let encoded: string[] = []
const drawImage = jest.fn()

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:x')
  URL.revokeObjectURL = jest.fn()
  Object.defineProperty(global.Image.prototype, 'src', {
    set() {
      Object.defineProperty(this, 'naturalWidth', { value: 400, configurable: true })
      Object.defineProperty(this, 'naturalHeight', { value: 200, configurable: true })
      setTimeout(() => (decodeOk ? this.onload() : this.onerror()))
    },
  })
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage })) as never
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    // Browsers that cannot write a type fall back to PNG; this one only "has" what encoded lists.
    const out = type && encoded.includes(type) ? type : 'image/png'
    cb(new Blob(['x'], { type: out }))
  }
})

beforeEach(() => {
  decodeOk = true
  encoded = ['image/webp', 'image/jpeg']
  drawImage.mockClear()
})

const file = (type: string) => new Blob(['data'], { type })

test('crops to the centre square and draws it at 256px', async () => {
  await resizeToAvatar(file('image/png'))
  // 400×200 → the middle 200×200, starting 100px in.
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 100, 0, 200, 200, 0, 0, 256, 256)
})

test('saves as WebP where the browser can', async () => {
  expect((await resizeToAvatar(file('image/png'))).type).toBe('image/webp')
})

test('falls back to JPEG where it cannot write WebP', async () => {
  encoded = ['image/jpeg']
  expect((await resizeToAvatar(file('image/png'))).type).toBe('image/jpeg')
})

test('refuses a file that is not an image', async () => {
  await expect(resizeToAvatar(file('application/pdf'))).rejects.toBeInstanceOf(AvatarReadError)
})

test('an image the browser cannot decode is a read error', async () => {
  decodeOk = false
  await expect(resizeToAvatar(file('image/png'))).rejects.toBeInstanceOf(AvatarReadError)
})
