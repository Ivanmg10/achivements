/**
 * A plate behind the content, leaning on the design's one angle (`--slant`, 12°;
 * upright in the round design), for a big piece that is the player's own: the
 * podium's steps. The content stays upright; the colour is the caller's
 * `before:bg-*`. Data never takes it: a bar whose length is the value stays upright.
 */
export const SLANT_PLATE =
  "relative isolate before:content-[''] before:absolute before:inset-0 before:-z-10 before:skew-x-(--slant) before:rounded-(--bar-radius)"

/** The signature glyph (`--mark`: "/" slanted, "•" round), drawn by `::before`. Put it on an `aria-hidden` span. */
export const MARK = 'before:content-(--mark)'
