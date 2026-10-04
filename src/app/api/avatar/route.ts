import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { forgetUser } from '@/lib/userRecord'
import { allowAttempt } from '@/lib/attemptLimit'
import { AVATAR_MAX_BYTES, avatarUrl, sniffImageType } from '@/lib/avatarImage'

/** Room for the multipart wrapping around the file itself. */
const FORM_OVERHEAD = 16 * 1024

/**
 * Upload an avatar from the device: a `file` field, already cropped and
 * resized in the browser. Checked here regardless — signed in, within the
 * upload limit, at most 512 KB, and a PNG, JPEG or WebP by its own bytes —
 * then stored, and the account's avatar pointed at it. The session picks it
 * up on the client's next update().
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Refuse an oversized body before reading it, when the client says its size.
    const declared = Number(req.headers.get('content-length') ?? 0)
    if (declared > AVATAR_MAX_BYTES + FORM_OVERHEAD) {
      return NextResponse.json({ error: 'too-large' }, { status: 413 })
    }

    if (!(await allowAttempt('avatar', `user:${userId}`))) {
      return NextResponse.json({ error: 'too-many-attempts' }, { status: 429 })
    }

    let file: FormDataEntryValue | null
    try {
      file = (await req.formData()).get('file')
    } catch {
      return NextResponse.json({ error: 'no-file' }, { status: 400 })
    }
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'no-file' }, { status: 400 })
    if (file.size === 0 || file.size > AVATAR_MAX_BYTES) {
      return NextResponse.json({ error: 'too-large' }, { status: 413 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const mime = sniffImageType(bytes)
    if (!mime) return NextResponse.json({ error: 'not-an-image' }, { status: 415 })

    const url = avatarUrl(userId, Date.now())
    // One statement, so the image and the pointer to it are saved together or not at all.
    await pool.query(
      `WITH saved AS (
         INSERT INTO user_avatars (user_id, image, mime, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id) DO UPDATE SET image = EXCLUDED.image, mime = EXCLUDED.mime, updated_at = NOW()
         RETURNING user_id
       )
       UPDATE users SET avatar = $4 WHERE id = (SELECT user_id FROM saved)`,
      [userId, Buffer.from(bytes), mime, url],
    )
    forgetUser(userId)

    return NextResponse.json({ ok: true, avatar: url })
  } catch (err) {
    console.error('[avatar POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
