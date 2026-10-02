/**
 * What the group endpoints accept. The form enforces the same text limits
 * (GroupModal's maxLength); the server is the authority, since anyone can
 * call the API without the form.
 */
export const GROUP_TITLE_MAX = 60
export const GROUP_DESCRIPTION_MAX = 200
export const GROUPS_PER_USER_MAX = 10
export const GROUP_ITEMS_MAX = 200

const ICON_URL_MAX = 500
/** An icon that is not a link is an emoji; the longest family emoji is 11 UTF-16 units. */
const ICON_TEXT_MAX = 16
const ITEM_TEXT_MAX = 200
const ITEM_IMAGE_MAX = 500
const COUNT_MAX = 1_000_000

export type GroupFields = { title: string; description: string | null; icon: string | null; is_public: boolean }

type Result<T> = { ok: true; value: T } | { ok: false; message: string }

const isUrl = (s: string) => /^https?:\/\//i.test(s)

/** A group's own fields, cleaned, or why they are refused. */
export function readGroupFields(body: unknown): Result<GroupFields> {
  const { title, description, icon, is_public } = (body ?? {}) as Record<string, unknown>

  if (typeof title !== 'string' || !title.trim()) return { ok: false, message: 'El título es obligatorio' }
  if (title.trim().length > GROUP_TITLE_MAX) return { ok: false, message: `Título: máximo ${GROUP_TITLE_MAX} caracteres` }

  if (description != null && typeof description !== 'string') return { ok: false, message: 'Descripción no válida' }
  if (typeof description === 'string' && description.length > GROUP_DESCRIPTION_MAX) {
    return { ok: false, message: `Descripción: máximo ${GROUP_DESCRIPTION_MAX} caracteres` }
  }

  if (icon != null && typeof icon !== 'string') return { ok: false, message: 'Icono no válido' }
  const iconText = typeof icon === 'string' ? icon.trim() : ''
  if (iconText.length > (isUrl(iconText) ? ICON_URL_MAX : ICON_TEXT_MAX)) return { ok: false, message: 'Icono no válido' }

  if (is_public != null && typeof is_public !== 'boolean') return { ok: false, message: 'is_public debe ser booleano' }

  return {
    ok: true,
    value: { title: title.trim(), description: description || null, icon: iconText || null, is_public: is_public ?? false },
  }
}

const isCount = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= COUNT_MAX
const optionalText = (s: unknown, max: number) => s == null || (typeof s === 'string' && s.length <= max)

export type ItemCounts = { num_awarded: number; max_possible: number; points_won: number; max_points: number }

/**
 * Progress counts as the browser computed them. They are a cache of what RA
 * or Steam say, shown on the group page, so they only have to be sane.
 * ponytail: trusts the browser's numbers within sane bounds; re-fetching
 * progress on the server would make them authoritative, at one RA/Steam call per game.
 */
export function readItemCounts(body: Record<string, unknown>): Result<ItemCounts> {
  const counts = {
    num_awarded: body.num_awarded ?? 0,
    max_possible: body.max_possible ?? 0,
    points_won: body.points_won ?? 0,
    max_points: body.max_points ?? 0,
  }
  if (!Object.values(counts).every(isCount)) return { ok: false, message: 'Contadores no válidos' }
  const c = counts as ItemCounts
  if (c.num_awarded > c.max_possible || c.points_won > c.max_points) {
    return { ok: false, message: 'Contadores no válidos' }
  }
  return { ok: true, value: c }
}

export type ItemFields = ItemCounts & {
  game_id: number
  title: string
  image_icon: string | null
  console_name: string | null
  pct_won: number
}

/** A game to add to a group, cleaned, or why it is refused. */
export function readItemFields(body: unknown): Result<ItemFields> {
  const b = (body ?? {}) as Record<string, unknown>
  const { game_id, title, image_icon, console_name } = b
  const pct_won = b.pct_won ?? 0

  if (!Number.isInteger(game_id) || (game_id as number) <= 0 || typeof title !== 'string' || !title.trim()) {
    return { ok: false, message: 'Datos incompletos' }
  }
  if (title.length > ITEM_TEXT_MAX || !optionalText(image_icon, ITEM_IMAGE_MAX) || !optionalText(console_name, ITEM_TEXT_MAX)) {
    return { ok: false, message: 'Datos no válidos' }
  }
  // A fraction: 1 is complete.
  if (typeof pct_won !== 'number' || !(pct_won >= 0 && pct_won <= 1)) return { ok: false, message: 'Datos no válidos' }

  const counts = readItemCounts(b)
  if (!counts.ok) return counts

  return {
    ok: true,
    value: {
      game_id: game_id as number,
      title,
      image_icon: (image_icon as string | null | undefined) ?? null,
      console_name: (console_name as string | null | undefined) ?? null,
      pct_won,
      ...counts.value,
    },
  }
}
