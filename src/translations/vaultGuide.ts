import type { Lang } from '@/context/LanguageContext'
import { de, fr, it, ja, pl, pt, ru } from './vaultGuideMore'

/**
 * "How Vault Points work" (/rankings/how), for users. Like the public pages in
 * seoPages.ts, kept out of the main translations on purpose (every page
 * downloads those, and this prose is read only here). In all nine languages:
 * English and Spanish here, the rest in vaultGuideMore.ts. The numbers in its tables and examples
 * are worked out from the real formula (src/utils/vaultScore.ts), never typed
 * in, so they cannot drift from it. Keep it in step with docs/rankings-plan.md.
 */

type Block = { heading: string; text: string; points?: string[] }

export type VaultGuideText = {
  title: string
  description: string
  heading: string
  intro: string
  back: string
  bag: Block
  rarity: Block & { colRarity: string; colMultiplier: string; everyone: string }
  difficulty: Block & { colReach: string; colMultiplier: string }
  extras: Block
  example: Block & { aaa: string; platforms: Record<'psn' | 'steam' | 'xbox' | 'ra', string>; quick: string; spam: string; easyNote: string }
  notCounted: Block
  levels: Block & { colTier: string; colLevels: string; colFrom: string }
  updates: Block
  faq: { q: string; a: string }[]
}

const en: VaultGuideText = {
  title: 'How Vault Points work',
  description: 'How CheevoVault scores achievements from RetroAchievements, Steam and PlayStation so that every platform is worth the same.',
  heading: 'How Vault Points work',
  intro:
    'Each platform counts achievements its own way: Xbox in gamerscore, PlayStation in bronze, silver and gold, RetroAchievements in points, Steam not at all. Adding those up would make the platform you play on matter more than how you play. Vault Points measure every achievement the same way, wherever it was earned.',
  back: 'Back to the rankings',
  bag: {
    heading: 'Every game is worth up to 1,000 points',
    text:
      'On any platform. Its achievements share those 1,000: a game with 5,000 achievements is worth no more than one with 50, it only splits them into smaller pieces. Most of the share is even among them; a quarter follows what the platform says each one is worth (gamerscore, trophy grade, RA points).',
  },
  rarity: {
    heading: 'Rarer achievements are worth more',
    text:
      'Each achievement is compared with the most common one of the same game, so it does not matter whether a platform counts everyone who owns the game or only who played it. Ten times rarer adds one more time its value, up to four times.',
    colRarity: 'Compared with the game’s most common achievement',
    colMultiplier: 'Worth',
    everyone: 'Everyone who plays it',
  },
  difficulty: {
    heading: 'Harder games are worth more',
    text:
      'How many of the people who start a game get to its hardest achievement. A game almost everyone finishes in an afternoon is worth less; a demanding one is worth it all. This applies to everything you earn in that game.',
    colReach: 'Who reaches its hardest achievement',
    colMultiplier: 'The game is worth',
  },
  extras: {
    heading: 'Finishing, softcore and repeated games',
    text: 'A few rules on top:',
    points: [
      'Finishing a game (100 %) adds a fifth more.',
      'On RetroAchievements, softcore unlocks count half, and only hardcore finishes a game.',
      'The same game listed again on one platform (another region, PS4 and PS5) counts half the second time, and a tenth after that.',
    ],
  },
  example: {
    heading: 'What that means in practice',
    text: 'Finished games, with example rarities. The same demanding game lands close on every platform, and a game anyone finishes in an afternoon is worth about a third of it.',
    aaa: 'The same demanding game, finished',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (a retro game as long)' },
    quick: 'A one-hour platinum',
    spam: 'A Steam game with 5,000 achievements',
    easyNote: 'Example figures to show the proportions, not real games.',
  },
  notCounted: {
    heading: 'What does not count',
    text: 'Your rankings follow your own choices:',
    points: [
      'Games you hid, and consoles you unticked in your preferences.',
      'Steam games where almost every achievement was unlocked in the same second (the mark of an unlock tool), until an admin reviews them.',
      'An account you unlinked.',
    ],
  },
  levels: {
    heading: 'Levels and ranks',
    text: 'Your level comes from your total points: the first ones come fast, each later one takes a little more, and there is no top.',
    colTier: 'Rank',
    colLevels: 'Levels',
    colFrom: 'From',
  },
  updates: {
    heading: 'When points change',
    text: 'Points are worked out ahead of time, not when a page asks:',
    points: [
      'When you link a platform, it starts at once. You appear in the rankings within seconds with an estimate (marked ≈), and the exact figure follows as your games are read: seconds for Steam and PlayStation, a little longer for a large RetroAchievements library.',
      'While you use CheevoVault, your points are refreshed every few hours, reading only the games you played since.',
      'Rarity changes slowly as more people play, so your points can move a little without you doing anything.',
    ],
  },
  faq: [
    { q: 'Why not just add up gamerscore, trophies and RA points?', a: 'Because the same game would be worth 49 on Steam and 1,440 on PlayStation. Vault Points use what every platform has in common: how many players have each achievement.' },
    { q: 'Does a platform give more points than another?', a: 'No: it is built so that it does not, and the admins check with real data that each platform’s typical game is worth the same.' },
    { q: 'Can I leave the rankings?', a: 'Yes, from your preferences (or by making your profile private). Your points are still worked out, only for you.' },
    { q: 'The rankings say beta: what can change?', a: 'Mostly the fine numbers of the formula, if real data shows a platform drifting. If they change, everyone’s points are worked out again the same way.' },
  ],
}

const es: VaultGuideText = {
  title: 'Cómo funcionan los Puntos Vault',
  description: 'Cómo puntúa CheevoVault los logros de RetroAchievements, Steam y PlayStation para que todas las plataformas valgan lo mismo.',
  heading: 'Cómo funcionan los Puntos Vault',
  intro:
    'Cada plataforma cuenta los logros a su manera: Xbox en gamerscore, PlayStation en bronce, plata y oro, RetroAchievements en puntos y Steam no los cuenta. Sumarlos haría que importara más la plataforma en la que juegas que cómo juegas. Los Puntos Vault miden todos los logros igual, los consigas donde los consigas.',
  back: 'Volver a los rankings',
  bag: {
    heading: 'Cada juego vale hasta 1.000 puntos',
    text:
      'En cualquier plataforma. Sus logros se reparten esos 1.000: un juego con 5.000 logros no vale más que uno con 50, solo los divide en trozos más pequeños. La mayor parte se reparte a partes iguales; una cuarta parte sigue lo que la plataforma dice que vale cada uno (gamerscore, grado del trofeo, puntos de RA).',
  },
  rarity: {
    heading: 'Los logros más raros valen más',
    text:
      'Cada logro se compara con el más común de su mismo juego, así que da igual que una plataforma cuente a todos los que tienen el juego o solo a quienes lo jugaron. Diez veces más raro suma una vez más su valor, hasta cuatro veces.',
    colRarity: 'Frente al logro más común del juego',
    colMultiplier: 'Vale',
    everyone: 'Todos los que lo juegan',
  },
  difficulty: {
    heading: 'Los juegos difíciles valen más',
    text:
      'Cuánta de la gente que empieza un juego llega a su logro más difícil. Un juego que casi todos terminan en una tarde vale menos; uno exigente vale entero. Se aplica a todo lo que ganes en ese juego.',
    colReach: 'Quién llega a su logro más difícil',
    colMultiplier: 'El juego vale',
  },
  extras: {
    heading: 'Completar, softcore y juegos repetidos',
    text: 'Unas reglas más:',
    points: [
      'Completar un juego (100 %) suma una quinta parte más.',
      'En RetroAchievements, los logros en softcore cuentan la mitad, y solo el hardcore completa un juego.',
      'El mismo juego repetido en una plataforma (otra región, PS4 y PS5) cuenta la mitad la segunda vez, y una décima parte a partir de ahí.',
    ],
  },
  example: {
    heading: 'Qué significa en la práctica',
    text: 'Juegos completados, con rarezas de ejemplo. El mismo juego exigente queda parecido en todas las plataformas, y un juego que cualquiera termina en una tarde vale más o menos un tercio.',
    aaa: 'El mismo juego exigente, completado',
    platforms: { psn: 'PlayStation', steam: 'Steam', xbox: 'Xbox', ra: 'RetroAchievements (un retro igual de largo)' },
    quick: 'Un platino de una hora',
    spam: 'Un juego de Steam con 5.000 logros',
    easyNote: 'Cifras de ejemplo para ver las proporciones, no juegos reales.',
  },
  notCounted: {
    heading: 'Qué no cuenta',
    text: 'Tus rankings siguen tus propias decisiones:',
    points: [
      'Los juegos que ocultaste y las consolas que desmarcaste en tus preferencias.',
      'Los juegos de Steam con casi todos los logros desbloqueados en el mismo segundo (la huella de un desbloqueador), hasta que un admin los revise.',
      'Una cuenta que desvinculaste.',
    ],
  },
  levels: {
    heading: 'Niveles y rangos',
    text: 'Tu nivel sale de tus puntos totales: los primeros llegan rápido, cada uno siguiente cuesta un poco más y no hay tope.',
    colTier: 'Rango',
    colLevels: 'Niveles',
    colFrom: 'Desde',
  },
  updates: {
    heading: 'Cuándo cambian los puntos',
    text: 'Los puntos se calculan antes, no cuando una página los pide:',
    points: [
      'Al vincular una plataforma empieza en el momento. Apareces en los rankings en segundos con una estimación (marcada con ≈), y la cifra exacta llega según se leen tus juegos: segundos en Steam y PlayStation, algo más con una biblioteca grande de RetroAchievements.',
      'Mientras usas CheevoVault, tus puntos se actualizan cada pocas horas, leyendo solo los juegos que jugaste desde la última vez.',
      'La rareza cambia despacio según juega más gente, así que tus puntos pueden moverse un poco sin que hagas nada.',
    ],
  },
  faq: [
    { q: '¿Por qué no sumar el gamerscore, los trofeos y los puntos de RA?', a: 'Porque el mismo juego valdría 49 en Steam y 1.440 en PlayStation. Los Puntos Vault usan lo que todas las plataformas tienen en común: cuántos jugadores tienen cada logro.' },
    { q: '¿Una plataforma da más puntos que otra?', a: 'No: está hecho para que no, y los admins comprueban con datos reales que el juego típico de cada plataforma vale lo mismo.' },
    { q: '¿Puedo salir de los rankings?', a: 'Sí, desde tus preferencias (o haciendo privado tu perfil). Tus puntos se siguen calculando, solo para ti.' },
    { q: 'Los rankings dicen beta: ¿qué puede cambiar?', a: 'Sobre todo los números finos de la fórmula, si los datos reales muestran que una plataforma se separa. Si cambian, los puntos de todos se recalculan igual.' },
  ],
}

const GUIDE: Record<Lang, VaultGuideText> = { en, es, de, fr, it, ja, pl, pt, ru }

/** The guide in the viewer's language (English for anything unknown). */
export function vaultGuideText(lang: Lang): VaultGuideText {
  return GUIDE[lang] ?? GUIDE.en
}
