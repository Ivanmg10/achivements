/**
 * The demo users of scripts/demo-rankings.mjs, one by one (preview database only).
 *
 * Each plays real games: the ones whose definitions the preview database
 * already holds in its cache (see `loadPool` there). A game is
 * [id, share, lastDaysAgo, spanDays]: Steam appid or PSN title id; the share of
 * its achievements earned (1 = all; 'p' = PSN's base game to the platinum, DLC
 * left); the last unlock that many days ago, the first `spanDays` before it.
 * A span of N days ending today, with N+ unlocks, is a streak of N days.
 *
 *   hours     the hours (UTC) they unlock at: [from, to), may wrap midnight
 *   weekends  only on Saturdays and Sundays
 *   seen      'online' (always), hours since last seen, or 'hidden' (presence off)
 *   showcase  how many of their rarest achievements they show off (0–5)
 *   isNew     joined this week: no place on Monday's ranking
 *
 * The first game of each platform is their favourite.
 */
const ORIGINALS = [
  {
    name: 'spex_guy', country: 'ES', theme: 'terminal', gender: 'male', genderPublic: true,
    bio: 'Llevo una hoja de cálculo con cada logro. Si no está al 100 %, no está terminado. 🤓',
    hours: [19, 24], seen: 'online', showcase: 5,
    steam: [[646570, 1, 0, 40], [1794680, 0.82, 45, 200], [221380, 0.46, 120, 300], [1927720, 1, 300, 6], [251630, 1, 380, 30], [535520, 1, 500, 20]],
  },
  {
    name: 'ratman', country: 'MX', theme: 'daxter', gender: 'male',
    bio: 'Me muevo por las alcantarillas de PlayStation. Sly, Jak y cualquier cosa con cola. 🐀',
    hours: [0, 4], seen: 3, showcase: 4,
    psn: [['NPWR42542_00', 1, 2, 18], ['NPWR43316_00', 1, 25, 20], ['NPWR43318_00', 0.55, 0, 6], ['NPWR32053_00', 1, 60, 10], ['NPWR12727_00', 1, 140, 14], ['NPWR12791_00', 0.72, 200, 30], ['NPWR12786_00', 0.3, 230, 10]],
  },
  {
    name: 'lester_the_molester', country: 'US', theme: 'san-andreas',
    bio: 'Yo planeo los golpes, tú pones la cara. Cinco estrellas de búsqueda y contando. 💻',
    hours: [1, 5], seen: 'hidden', showcase: 3,
    steam: [[12210, 0.78, 8, 90], [243470, 1, 150, 40], [2668510, 0.4, 30, 20]],
    psn: [['NPWR06221_00', 1, 70, 120], ['NPWR08691_00', 1, 260, 45], ['NPWR07410_00', 0.66, 3, 25]],
  },
  {
    name: 'rA9', country: 'US', theme: 'arctic',
    bio: 'Desviado desde 2038. Cada platino me acerca a ser real. rA9 🔷',
    hours: [9, 13], seen: 'online', showcase: 5,
    psn: [['NPWR09167_00', 1, 1, 30], ['NPWR06221_00', 1, 40, 25], ['NPWR08997_00', 1, 80, 60], ['NPWR11436_00', 1, 110, 20], ['NPWR11435_00', 1, 130, 18], ['NPWR04841_00', 1, 170, 30], ['NPWR10636_00', 1, 200, 15], ['NPWR19936_00', 1, 230, 12], ['NPWR32053_00', 1, 250, 8], ['NPWR42542_00', 1, 270, 9]],
    steam: [[374320, 1, 320, 40], [1927720, 1, 6, 3]],
  },
  {
    name: 'bluesoul', country: 'ES', theme: 'gruvbox', gender: 'neutral', genderPublic: true,
    bio: 'Praise the sun ☀️ Muero, aprendo, repito. Ahora a por el platino del III, otra vez.',
    hours: [22, 3], seen: 0.3, showcase: 4,
    psn: [['NPWR07897_00', 0.85, 0, 35]],
    steam: [[374320, 1, 400, 60], [646570, 0.3, 15, 20], [535520, 0.6, 90, 10]],
  },
  {
    name: 'lunapixel', country: 'FR', theme: 'sakura', gender: 'female', genderPublic: true,
    bio: 'Juegos bonitos, música tranquila y una taza de té. 🌙',
    hours: [20, 23], seen: 26, showcase: 3,
    steam: [[1927720, 1, 3, 2], [646570, 0.15, 50, 10], [1794680, 0.2, 100, 15]],
  },
  {
    name: 'trophywolf', country: 'MX', theme: 'black-ops-2', gender: 'male',
    bio: 'Prestigio 10 en BO2 y ahora a por todo lo demás. Si hay trofeo, hay lobo. 🐺',
    hours: [17, 23], seen: 'online', showcase: 5,
    psn: [['NPWR02059_00', 1, 900, 120], ['NPWR59721_00', 0.9, 4, 40], ['NPWR08801_00', 0.75, 30, 90], ['NPWR25959_00', 0.6, 1, 20], ['NPWR22022_00', 0.4, 12, 25]],
  },
  {
    name: 'cartucho88', country: 'AR', theme: 'dark-red', gender: 'male',
    bio: 'Crecí con la PS2 y no pienso soltarla. Remasters, nostalgia y cero prisas.',
    hours: [10, 14], weekends: true, seen: 6, showcase: 3,
    psn: [['NPWR12727_00', 1, 400, 20], ['NPWR19936_00', 0.8, 14, 30], ['NPWR08691_00', 0.55, 60, 40], ['NPWR42542_00', 0.7, 300, 15], ['NPWR01002_00', 0.35, 180, 10]],
  },
  {
    name: 'pumpernickel', country: 'DE', theme: 'bentley', gender: 'male',
    bio: 'Panadero de día, mecánico virtual de noche. Los domingos monto motores. 🥖🔧',
    hours: [7, 10], weekends: true, seen: 50, showcase: 2,
    steam: [[1190000, 0.7, 6, 200], [221380, 0.2, 40, 100]],
  },
  {
    name: 'akane_rx', country: 'JP', theme: 'rose-pine', gender: 'female', genderPublic: true,
    bio: 'Inazuma Eleven desde la DS. ¡Tornado de fuego! ⚽🔥',
    hours: [0, 3], seen: 'online', showcase: 4,
    steam: [[2799860, 1, 2, 45], [1794680, 0.4, 70, 30]],
    psn: [['NPWR09167_00', 0.5, 150, 20]],
  },
  {
    name: 'speedrunpaco', country: 'ES', theme: 'oled', gender: 'male',
    bio: 'Si dura más de dos horas, no es para mí. Cortos, difíciles y con cronómetro. ⏱️',
    hours: [15, 19], seen: 0.2, showcase: 5,
    steam: [[251630, 1, 1, 3], [2824660, 0.85, 10, 25], [535520, 1, 40, 5], [1794680, 0.9, 90, 30]],
  },
  {
    name: 'srtortuga', country: 'CL', theme: 'green',
    bio: 'Voy a mi ritmo. Algún día termino el Fallout. Algún día. 🐢',
    hours: [18, 21], seen: 960, showcase: 0,
    steam: [[377160, 0.12, 210, 400], [221380, 0.05, 600, 200]],
    psn: [['NPWR01002_00', 0.08, 700, 30]],
  },
  {
    name: 'elplatinador', country: 'CO', theme: 'red', gender: 'male',
    bio: 'Platino, siguiente. Platino, siguiente. No me hables de DLC.',
    hours: [18, 24], seen: 'online', showcase: 5,
    psn: [['NPWR03885_00', 1, 500, 60], ['NPWR07410_00', 'p', 20, 30], ['NPWR10636_00', 1, 60, 12], ['NPWR09167_00', 'p', 5, 25], ['NPWR08997_00', 'p', 120, 50], ['NPWR11010_00', 1, 300, 40]],
  },
  {
    name: 'mothlight', country: 'PL', theme: 'synthwave',
    bio: 'Una partida más a Vampire Survivors y me acuesto. (Son las 4 de la mañana.) 🦋',
    hours: [1, 5], seen: 'online', showcase: 4,
    steam: [[1794680, 1, 0, 60], [646570, 0.4, 100, 30]],
  },
  {
    name: 'kraken64', country: 'PT', theme: 'ocean', gender: 'male',
    bio: "Pirata de sofá. Black Flag es el mejor Assassin's y no acepto discusión. 🏴‍☠️🐙",
    hours: [21, 24], seen: 1, showcase: 4,
    psn: [['NPWR04841_00', 1, 30, 50], ['NPWR11436_00', 0.8, 3, 20], ['NPWR11435_00', 1, 90, 25]],
  },
  {
    name: 'galletamaria', country: 'ES', theme: 'light', gender: 'female', genderPublic: true,
    bio: 'Juego con mis peques los fines de semana. Mi hijo dice que Daxter es su mejor amigo. 🍪',
    hours: [10, 13], weekends: true, seen: 75, showcase: 2,
    psn: [['NPWR32053_00', 0.6, 2, 30], ['NPWR42542_00', 0.4, 16, 20], ['NPWR12727_00', 0.3, 50, 15]],
    steam: [[1927720, 0.7, 9, 10]],
  },
  {
    name: 'hikari', country: 'JP', theme: 'catppuccin', gender: 'female',
    bio: 'Cartas, rompecabezas y gatos. 光',
    hours: [12, 16], seen: 'online', showcase: 4,
    steam: [[646570, 0.9, 1, 120], [1927720, 1, 140, 5], [2799860, 0.3, 60, 10]],
  },
  {
    name: 'rustyspoon', country: 'US', theme: 'dark-green', gender: 'male',
    bio: 'Superviviente del Yermo. 400 horas en Sanctuary y aún no he acabado la historia. ☢️',
    hours: [19, 23], seen: 9, showcase: 3,
    steam: [[377160, 0.9, 4, 180], [2668510, 0.6, 220, 40]],
    psn: [['NPWR08997_00', 1, 600, 90]],
  },
  {
    name: 'bitcrusher', country: 'US', theme: 'blue', gender: 'male',
    bio: 'Triples sobre la bocina y kickflips. Deportes y nada más. 🏀🛹',
    hours: [16, 22], seen: 5, showcase: 3,
    psn: [['NPWR11010_00', 1, 400, 90], ['NPWR09157_00', 0.9, 700, 80], ['NPWR01002_00', 0.7, 25, 60], ['NPWR19936_00', 1, 7, 15]],
  },
  {
    name: 'vespertine', country: 'IT', theme: 'rose-pine', gender: 'female',
    bio: 'Solo juego cuando cae el sol. Almas, cartas y oscuridad. 🕯️',
    hours: [21, 2], seen: 14, showcase: 4,
    steam: [[374320, 0.75, 20, 70], [646570, 0.6, 3, 40]],
    psn: [['NPWR07897_00', 1, 500, 70]],
  },
  {
    name: 'zelda4ever', country: 'BR', theme: 'green',
    bio: 'Aquí no hay ningún Zelda, pero sigo esperando. Mientras, pruebo un poco de todo.',
    hours: [14, 20], seen: 30, showcase: 1,
    steam: [[1262540, 0.1, 10, 2], [377160, 0.08, 300, 3], [12210, 0.1, 280, 5], [243470, 0.15, 100, 4], [2668510, 0.12, 50, 3], [1794680, 0.05, 2, 1], [1190000, 0.06, 130, 2], [221380, 0.03, 400, 2]],
    psn: [['NPWR25959_00', 0.2, 30, 2], ['NPWR22022_00', 0.1, 60, 3]],
  },
  {
    name: 'tinyforge', country: 'GB', theme: 'bentley', gender: 'male',
    bio: 'Construyo imperios en AoE II y motores en el taller. Paciencia infinita. ⚒️',
    hours: [18, 22], seen: 'online', showcase: 5,
    steam: [[221380, 0.85, 1, 500], [1190000, 1, 200, 120]],
  },
  {
    name: 'ghostpepper', country: 'MX', theme: 'red',
    bio: 'Si no me hace sufrir, no me interesa. 🌶️ The Impossible Game al 100 % fue mi terapia.',
    hours: [20, 1], seen: 2, showcase: 5,
    steam: [[251630, 1, 30, 60], [374320, 1, 15, 30], [535520, 1, 100, 12], [2824660, 0.6, 5, 20]],
  },
  {
    name: 'oxidiana', country: 'CO', theme: 'snake-eater', gender: 'female', genderPublic: true,
    bio: 'Vaquera de corazón. Red Dead es mi casa. 🤠',
    hours: [19, 23], seen: 4, showcase: 3,
    steam: [[2668510, 1, 6, 80]],
    psn: [['NPWR06221_00', 0.4, 200, 30]],
  },
  {
    name: 'mandrake', country: 'ES', theme: 'purple',
    bio: 'Nuevo por aquí 👋 Recién llegado a CheevoVault y con ganas de subir.',
    hours: [17, 23], seen: 'online', showcase: 0, isNew: true,
    steam: [[1794680, 0.35, 0, 6], [646570, 0.2, 1, 5], [1927720, 0.8, 2, 2]],
  },
  {
    name: 'sidequest', country: 'GB', theme: 'clank', gender: 'neutral',
    bio: 'La historia principal puede esperar. Antes, el recado del granjero.',
    hours: [18, 23], seen: 20, showcase: 3,
    psn: [['NPWR09167_00', 0.9, 12, 60], ['NPWR08997_00', 0.7, 140, 90]],
    steam: [[2668510, 0.8, 60, 50], [243470, 0.5, 300, 40]],
  },
  {
    name: 'chiptune', country: 'PL', theme: 'synthwave',
    bio: '8 bits en el corazón. Si tiene píxeles gordos y es difícil, cuenta conmigo. 🎶',
    hours: [22, 2], seen: 7, showcase: 4,
    steam: [[2824660, 1, 9, 30], [251630, 0.75, 70, 20], [1794680, 0.7, 20, 80], [535520, 0.6, 200, 20]],
  },
  {
    name: 'polaroid', country: 'FR', theme: 'light-red', private: true,
    bio: 'Perfil privado. Solo fotos y recuerdos. 📷',
    hours: [11, 15], seen: 48, showcase: 2,
    steam: [[1927720, 1, 30, 5]],
    psn: [['NPWR43316_00', 0.6, 100, 20]],
  },
  {
    name: 'nimbus', country: 'BR', theme: 'dark',
    bio: 'Online o nada. Squad a las 22 h, trae micro. ☁️🎮',
    hours: [21, 1], seen: 'online', showcase: 3,
    psn: [['NPWR25959_00', 1, 0, 25], ['NPWR22022_00', 0.75, 3, 90], ['NPWR08801_00', 0.5, 50, 40]],
  },
  {
    name: 'cobaltfox', country: 'IT', theme: 'blue', gender: 'male', unranked: true,
    bio: 'Gasolina en las venas. Rally, NFS y cero frenos. 🦊🏁 (Fuera de los rankings, por gusto.)',
    hours: [19, 23], seen: 12, showcase: 3,
    steam: [[1262540, 0.92, 2, 50], [2824660, 0.7, 30, 20]],
  },
]

/** Names of the twins, one per original in order: the same person, another name and picture. */
const TWINS = [
  'pixel_nomad', 'duskrunner', 'frostbyte', 'lagartija', 'nebulosa', 'tostada', 'quasar', 'kitsune', 'marmota', 'byte_bandit',
  'eclipse', 'gominola', 'turbo_abuela', 'sombra', 'neonwolf', 'cachalote', 'vortex', 'mermelada', 'glitchy', 'perezoso',
  'starfall', 'chorizo', 'obsidian', 'pulpo_x', 'ramen', 'solstice', 'trasgo', 'zigzag', 'lemming', 'bonsai',
]

export const PERSONAS = [...ORIGINALS, ...ORIGINALS.map((p, i) => ({ ...p, name: TWINS[i], avatarIndex: 1 }))]
