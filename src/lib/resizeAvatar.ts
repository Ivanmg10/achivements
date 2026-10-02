/** Side of a stored avatar, in px: twice the largest place it is drawn (the account card, 112px). */
export const AVATAR_SIZE = 256

export class AvatarReadError extends Error {}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new AvatarReadError('Could not decode the image'))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Turns whatever image the user picked into a small square avatar, in the
 * browser: cropped to its centre, drawn at 256px, saved as WebP (JPEG where
 * the browser cannot write WebP). A photo of several MB leaves as ~20 KB, and
 * whatever the file was (SVG included) leaves as plain pixels.
 */
export async function resizeToAvatar(file: Blob, size = AVATAR_SIZE): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new AvatarReadError('Not an image')
  const img = await loadImage(file)
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  if (!side) throw new AvatarReadError('Empty image')

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AvatarReadError('No canvas')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)

  const webp = await toBlob(canvas, 'image/webp', 0.85)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.88)
  if (!jpeg) throw new AvatarReadError('Could not encode the image')
  return jpeg
}
