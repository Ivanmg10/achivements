import type { Lang } from '@/context/LanguageContext'

/**
 * The public pages written to answer what people ask a search engine or a chat
 * AI ("a PSNProfiles alternative that also tracks Steam"). Kept out of the main
 * translations on purpose: those are downloaded by every page, and this prose
 * is read only here. English and Spanish; any other language falls back to
 * English. The server renders English, which is what crawlers read.
 *
 * Keep them honest (each comparison says where the other site is better) and
 * never mention Xbox while it is admin-only.
 */

export type FaqItem = { q: string; a: string }

export type SeoPageText = {
  /** Short label for the links between these pages and from the landing. */
  link: string
  /** <title>, kept near 60 characters. */
  title: string
  /** Meta description, under ~160 characters. */
  description: string
  heading: string
  intro: string
  sections: { heading: string; text?: string; points?: string[] }[]
  faq: FaqItem[]
  /** Small print under the page, e.g. whose trademarks are named. */
  note?: string
}

export type SeoSection = 'compare' | 'track'

export type SeoPageEntry = {
  section: SeoSection
  slug: string
  /** Last time the copy changed (the sitemap's lastModified). */
  updated: string
  text: { en: SeoPageText } & Partial<Record<Lang, SeoPageText>>
}

export const SEO_PAGES: SeoPageEntry[] = [
  {
    section: 'compare',
    slug: 'exophase',
    updated: '2026-10-17',
    text: {
      en: {
        link: 'CheevoVault vs Exophase',
        title: 'CheevoVault vs Exophase: achievement trackers compared',
        description: 'How CheevoVault and Exophase differ for tracking RetroAchievements, Steam and PlayStation: platforms, hardcore mode, missables, groups and streaks.',
        heading: 'CheevoVault vs Exophase',
        intro: 'Both are free sites that pull your achievements from several platforms into one profile. They are built for different things.',
        sections: [
          {
            heading: 'Where Exophase is the better pick',
            points: [
              'More platforms: Exophase follows Xbox, GOG, Epic and others besides Steam, PlayStation and RetroAchievements. CheevoVault covers RetroAchievements, Steam and PlayStation.',
              'A bigger community, with leaderboards that rank its users against each other, and years of history.',
            ],
          },
          {
            heading: 'Where CheevoVault is the better pick',
            points: [
              'RetroAchievements first: hardcore and softcore are kept apart in every bar, stat and chart, and missable achievements are flagged before you pass the point of no return.',
              'Your library, sorted your way: make your own groups (a franchise, a backlog, "beat this year"), and pin the games you are playing and the achievements you are chasing.',
              'Habits, not only totals: day streaks, a year heatmap, your rarest unlocks and what you played this week across all three accounts.',
              'Ask an AI: export a game\'s pending achievements to a file and ask any chat AI for a plan, in your language. The file holds only the game, never your account.',
            ],
          },
          {
            heading: 'Which one to pick',
            text: 'Many platforms and a leaderboard to climb: Exophase. RetroAchievements plus Steam and PlayStation, organised and followed day by day: CheevoVault. One does not exclude the other.',
          },
        ],
        faq: [
          { q: 'Is CheevoVault free?', a: 'Yes. Every feature is free, and there is no paid tier.' },
          { q: 'Do I need a RetroAchievements API key?', a: 'Yes, your own. RetroAchievements asks that every user signs requests with their own key, so CheevoVault never uses a shared one.' },
          { q: 'Can I use it with only one platform?', a: 'Yes. Connect one, two or all three accounts, whenever you like.' },
        ],
        note: 'Exophase is a trademark of its owner. CheevoVault is not affiliated with it.',
      },
      es: {
        link: 'CheevoVault vs Exophase',
        title: 'CheevoVault vs Exophase: comparativa de trackers de logros',
        description: 'En qué se diferencian CheevoVault y Exophase para seguir RetroAchievements, Steam y PlayStation: plataformas, hardcore, logros perdibles, grupos y rachas.',
        heading: 'CheevoVault vs Exophase',
        intro: 'Las dos son webs gratis que juntan tus logros de varias plataformas en un perfil. Están pensadas para cosas distintas.',
        sections: [
          {
            heading: 'Cuándo es mejor Exophase',
            points: [
              'Más plataformas: Exophase sigue Xbox, GOG, Epic y otras además de Steam, PlayStation y RetroAchievements. CheevoVault cubre RetroAchievements, Steam y PlayStation.',
              'Una comunidad más grande, con clasificaciones entre sus usuarios, y años de historial.',
            ],
          },
          {
            heading: 'Cuándo es mejor CheevoVault',
            points: [
              'RetroAchievements primero: hardcore y softcore van separados en cada barra, estadística y gráfica, y los logros perdibles se avisan antes de pasar el punto sin retorno.',
              'Tu biblioteca, ordenada a tu manera: crea tus propios grupos (una saga, el backlog, "terminar este año") y fija los juegos que estás jugando y los logros que persigues.',
              'Hábitos, no solo totales: rachas de días, un mapa de calor del año, tus logros más raros y lo que jugaste esta semana en las tres cuentas.',
              'Pregunta a una IA: exporta los logros pendientes de un juego a un archivo y pide un plan a cualquier IA de chat, en tu idioma. El archivo solo lleva el juego, nunca tu cuenta.',
            ],
          },
          {
            heading: 'Cuál elegir',
            text: 'Muchas plataformas y una clasificación que escalar: Exophase. RetroAchievements más Steam y PlayStation, organizado y seguido día a día: CheevoVault. Una no excluye a la otra.',
          },
        ],
        faq: [
          { q: '¿CheevoVault es gratis?', a: 'Sí. Todo es gratis y no hay ninguna versión de pago.' },
          { q: '¿Necesito una clave de API de RetroAchievements?', a: 'Sí, la tuya. RetroAchievements pide que cada usuario firme las peticiones con su propia clave, así que CheevoVault nunca usa una compartida.' },
          { q: '¿Puedo usarlo con una sola plataforma?', a: 'Sí. Conecta una, dos o las tres cuentas, cuando quieras.' },
        ],
        note: 'Exophase es una marca de su propietario. CheevoVault no tiene relación con ella.',
      },
    },
  },
  {
    section: 'compare',
    slug: 'psnprofiles',
    updated: '2026-10-17',
    text: {
      en: {
        link: 'A PSNProfiles alternative',
        title: 'A PSNProfiles alternative that also tracks Steam and retro games',
        description: 'Track your PlayStation trophies next to your Steam achievements and RetroAchievements. What CheevoVault does differently from PSNProfiles, and what it does not.',
        heading: 'A PSNProfiles alternative for people who play on more than PlayStation',
        intro: 'PSNProfiles is the place for PlayStation trophies. If your games are spread across PlayStation, Steam and emulators, CheevoVault puts them in one library.',
        sections: [
          {
            heading: 'What PSNProfiles does better',
            points: [
              'Trophy guides and roadmaps written by its community, and a large forum.',
              'Leaderboards, by country and worldwide.',
              'Years of depth on PlayStation alone.',
            ],
          },
          {
            heading: 'What CheevoVault adds',
            points: [
              'PlayStation, Steam and RetroAchievements side by side, each game with its real progress, hours and rarity, and stats across all of them.',
              'DLC counted the way Sony counts it: a platinum with DLC trophies left is still in progress, not done.',
              'Collections understood: a collection that holds several trophy sets (the Ezio Collection, say) shows as one game in your recent activity.',
              'Groups and pins to organise the library your way, plus day streaks and a year heatmap.',
            ],
          },
          {
            heading: 'How linking works',
            text: 'Type your PSN online ID. Your trophies have to be visible in PlayStation\'s privacy settings; nothing else is needed, no password and no Sony sign-in.',
          },
        ],
        faq: [
          { q: 'Do I give CheevoVault my PlayStation password?', a: 'No. Only your online ID.' },
          { q: 'Why does it say my profile is private?', a: 'Your trophy list is hidden in PlayStation\'s privacy settings. Make it visible to anyone and try again.' },
          { q: 'Is it free?', a: 'Yes. Every feature is free, and there is no paid tier.' },
        ],
        note: 'PSNProfiles is a trademark of its owner. CheevoVault is not affiliated with it, nor with Sony.',
      },
      es: {
        link: 'Una alternativa a PSNProfiles',
        title: 'Una alternativa a PSNProfiles que también sigue Steam y retro',
        description: 'Sigue tus trofeos de PlayStation junto a tus logros de Steam y RetroAchievements. Qué hace CheevoVault distinto de PSNProfiles, y qué no.',
        heading: 'Una alternativa a PSNProfiles para quien juega en más que PlayStation',
        intro: 'PSNProfiles es el sitio de los trofeos de PlayStation. Si tus juegos están repartidos entre PlayStation, Steam y emuladores, CheevoVault los junta en una biblioteca.',
        sections: [
          {
            heading: 'Lo que PSNProfiles hace mejor',
            points: [
              'Guías de trofeos y roadmaps escritos por su comunidad, y un foro enorme.',
              'Clasificaciones por país y mundiales.',
              'Años de profundidad solo en PlayStation.',
            ],
          },
          {
            heading: 'Lo que añade CheevoVault',
            points: [
              'PlayStation, Steam y RetroAchievements juntos, cada juego con su progreso real, horas y rareza, y estadísticas de todos.',
              'Los DLC cuentan como los cuenta Sony: un platino con trofeos de DLC pendientes sigue en curso, no terminado.',
              'Colecciones bien entendidas: una colección con varias listas de trofeos (la Ezio Collection, por ejemplo) sale como un solo juego en tu actividad reciente.',
              'Grupos y fijados para organizar la biblioteca a tu manera, además de rachas de días y un mapa de calor del año.',
            ],
          },
          {
            heading: 'Cómo se vincula',
            text: 'Escribe tu ID online de PSN. Tus trofeos tienen que estar visibles en los ajustes de privacidad de PlayStation; no hace falta nada más, ni contraseña ni iniciar sesión en Sony.',
          },
        ],
        faq: [
          { q: '¿Le doy a CheevoVault mi contraseña de PlayStation?', a: 'No. Solo tu ID online.' },
          { q: '¿Por qué dice que mi perfil es privado?', a: 'Tu lista de trofeos está oculta en los ajustes de privacidad de PlayStation. Hazla visible para todos y vuelve a probar.' },
          { q: '¿Es gratis?', a: 'Sí. Todo es gratis y no hay ninguna versión de pago.' },
        ],
        note: 'PSNProfiles es una marca de su propietario. CheevoVault no tiene relación con ella, ni con Sony.',
      },
    },
  },
  {
    section: 'track',
    slug: 'retroachievements-steam-playstation',
    updated: '2026-10-17',
    text: {
      en: {
        link: 'RetroAchievements, Steam and PSN in one place',
        title: 'Track RetroAchievements, Steam and PSN trophies in one place',
        description: 'One free library for your RetroAchievements, Steam achievements and PlayStation trophies: completion, hours, rarity, streaks and what is left to hunt.',
        heading: 'Track RetroAchievements, Steam and PlayStation trophies in one place',
        intro: 'Each platform has its own site and its own numbers. CheevoVault reads all three and shows them together.',
        sections: [
          {
            heading: 'What you get',
            points: [
              'One library: every game with achievements earned, points, hours and rarity, from any of the three.',
              'Completion stats across platforms: finished, in progress, untouched.',
              'Day streaks and a heatmap of every day you unlocked something.',
              'Your rarest unlocks and what you played this week.',
              'Only the consoles you care about: untick a console and it leaves your lists and stats. Nothing is deleted.',
            ],
          },
          {
            heading: 'Connecting each account',
            points: [
              'RetroAchievements: your username and your own API key, from your RetroAchievements settings page.',
              'Steam: your custom URL name, profile link or SteamID64. The profile and its game details must be public.',
              'PlayStation: your online ID, with your trophies visible.',
            ],
          },
        ],
        faq: [
          { q: 'Is it free?', a: 'Yes. Every feature is free, and there is no paid tier.' },
          { q: 'Does it change anything on my accounts?', a: 'No. It only reads them.' },
          { q: 'Why does Steam show an empty library?', a: 'Your game details are private in Steam\'s privacy settings. Make them public and refresh.' },
        ],
      },
      es: {
        link: 'RetroAchievements, Steam y PSN en un sitio',
        title: 'Sigue tus logros de RetroAchievements, Steam y PSN en un sitio',
        description: 'Una biblioteca gratis para tus logros de RetroAchievements y Steam y tus trofeos de PlayStation: progreso, horas, rareza, rachas y lo que falta.',
        heading: 'Sigue tus logros de RetroAchievements, Steam y PlayStation en un sitio',
        intro: 'Cada plataforma tiene su web y sus números. CheevoVault lee las tres y las enseña juntas.',
        sections: [
          {
            heading: 'Qué tienes',
            points: [
              'Una biblioteca: cada juego con sus logros, puntos, horas y rareza, venga de donde venga.',
              'Estadísticas de progreso de todas las plataformas: terminados, en curso, sin empezar.',
              'Rachas de días y un mapa de calor con cada día que desbloqueaste algo.',
              'Tus logros más raros y lo que jugaste esta semana.',
              'Solo las consolas que te importan: desmarca una y sale de tus listas y estadísticas. No se borra nada.',
            ],
          },
          {
            heading: 'Cómo se conecta cada cuenta',
            points: [
              'RetroAchievements: tu usuario y tu propia clave de API, de la página de ajustes de RetroAchievements.',
              'Steam: tu nombre de URL personalizada, el enlace a tu perfil o tu SteamID64. El perfil y los detalles de juegos tienen que ser públicos.',
              'PlayStation: tu ID online, con los trofeos visibles.',
            ],
          },
        ],
        faq: [
          { q: '¿Es gratis?', a: 'Sí. Todo es gratis y no hay ninguna versión de pago.' },
          { q: '¿Cambia algo en mis cuentas?', a: 'No. Solo las lee.' },
          { q: '¿Por qué Steam sale con la biblioteca vacía?', a: 'Los detalles de juegos son privados en los ajustes de privacidad de Steam. Hazlos públicos y recarga.' },
        ],
      },
    },
  },
  {
    section: 'track',
    slug: 'achievements-with-friends',
    updated: '2026-10-17',
    text: {
      en: {
        link: 'Compare achievements with friends',
        title: 'Compare achievements with your friends across platforms',
        description: 'Follow friends, open their public profiles and compare your progress on the same game, for RetroAchievements, Steam and PlayStation. Free.',
        heading: 'Compare achievements with your friends',
        intro: 'Hunting is more fun when someone else is doing it too.',
        sections: [
          {
            heading: 'How it works',
            points: [
              'Follow anyone with a public profile; they appear in your Following section.',
              'Open their profile: their platforms, favourite games, public groups, pinned achievements and recent activity.',
              'Compare a game: open a game on their profile and see your progress next to theirs, achievement by achievement.',
            ],
          },
          {
            heading: 'Privacy',
            text: 'Your profile can be made private at any time. A public profile shows signed-in users your progress, never your email or your keys. Nobody is told who follows them.',
          },
        ],
        faq: [
          { q: 'Can people outside CheevoVault see my profile?', a: 'No. Only signed-in users, and only while your profile is public.' },
          { q: 'Do my friends need the same platforms as me?', a: 'No. You compare on the games you both have.' },
        ],
      },
      es: {
        link: 'Compara logros con amigos',
        title: 'Compara tus logros con tus amigos en todas las plataformas',
        description: 'Sigue a tus amigos, abre sus perfiles públicos y compara tu progreso en el mismo juego, en RetroAchievements, Steam y PlayStation. Gratis.',
        heading: 'Compara tus logros con tus amigos',
        intro: 'Cazar logros es más divertido cuando alguien más también lo hace.',
        sections: [
          {
            heading: 'Cómo funciona',
            points: [
              'Sigue a cualquiera con perfil público; aparece en tu sección de Siguiendo.',
              'Abre su perfil: sus plataformas, juegos favoritos, grupos públicos, logros fijados y actividad reciente.',
              'Compara un juego: ábrelo en su perfil y ve tu progreso junto al suyo, logro a logro.',
            ],
          },
          {
            heading: 'Privacidad',
            text: 'Puedes hacer tu perfil privado cuando quieras. Un perfil público enseña tu progreso a los usuarios con sesión iniciada, nunca tu email ni tus claves. A nadie se le dice quién le sigue.',
          },
        ],
        faq: [
          { q: '¿Puede ver mi perfil gente de fuera de CheevoVault?', a: 'No. Solo usuarios con sesión iniciada, y solo mientras tu perfil sea público.' },
          { q: '¿Mis amigos necesitan las mismas plataformas que yo?', a: 'No. Comparáis en los juegos que tengáis los dos.' },
        ],
      },
    },
  },
]
