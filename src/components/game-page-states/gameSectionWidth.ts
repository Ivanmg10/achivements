/**
 * A game page's column: its header and table, at most 1760 px wide and centred, so on a 2560 px screen a
 * row's name and its figures stay close; the game's backdrop behind it still takes the whole width
 * (#129, "MejJuego8", on trial: revert this commit if the owner does not like it on the page).
 */
export const GAME_COLUMN = 'relative w-full max-w-[110rem] mx-auto flex flex-col items-center'

/** The width of what sits under a game page's header: a gutter on each side, wider from `sm` and `lg`. */
export const GAME_SECTION_WIDTH = 'w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)]'
