'use client'

import { useEffect, useState } from 'react'
import { steamAssetUrl } from '@/lib/steamClient'

const RA_IMAGES: string[] = [
  'https://media.retroachievements.org/Images/122047.png',
  'https://media.retroachievements.org/Images/097499.png',
  'https://media.retroachievements.org/Images/107150.png',
  'https://media.retroachievements.org/Images/109728.png',
  'https://media.retroachievements.org/Images/104482.png',
  'https://media.retroachievements.org/Images/061105.png',
  'https://media.retroachievements.org/Images/089222.png',
  'https://media.retroachievements.org/Images/109943.png',
  'https://media.retroachievements.org/Images/022051.png',
  'https://media.retroachievements.org/Images/095107.png',
  'https://media.retroachievements.org/Images/113279.png',
  'https://media.retroachievements.org/Images/112421.png',
  'https://media.retroachievements.org/Images/067087.png',
  'https://media.retroachievements.org/Images/106752.png',
  'https://media.retroachievements.org/Images/068336.png',
  'https://media.retroachievements.org/Images/064807.png',
  'https://media.retroachievements.org/Images/116501.png',
  'https://media.retroachievements.org/Images/124258.png',
  'https://media.retroachievements.org/Images/125487.png',
  'https://media.retroachievements.org/Images/112858.png',
  'https://media.retroachievements.org/Images/104260.png',
  'https://media.retroachievements.org/Images/105173.png',
  'https://media.retroachievements.org/Images/068144.png',
  'https://media.retroachievements.org/Images/114756.png',
  'https://media.retroachievements.org/Images/062373.png',
  'https://media.retroachievements.org/Images/103756.png',
  'https://media.retroachievements.org/Images/093950.png',
  'https://media.retroachievements.org/Images/100662.png',
  'https://media.retroachievements.org/Images/058558.png',
  'https://media.retroachievements.org/Images/122562.png',
  'https://media.retroachievements.org/Images/126558.png',
  'https://media.retroachievements.org/Images/071275.png',
  'https://media.retroachievements.org/Images/124487.png',
  'https://media.retroachievements.org/Images/052103.png',
  'https://media.retroachievements.org/Images/060426.png',
  'https://media.retroachievements.org/Images/104787.png',
  'https://media.retroachievements.org/Images/045842.png',
  'https://media.retroachievements.org/Images/089382.png',

  // Added from game ids sent by the user; art fetched from the RA API.
  'https://media.retroachievements.org/Images/068145.png', // Pokémon Colosseum (GameCube)
  'https://media.retroachievements.org/Images/081263.png', // Super Mario Sunshine (GameCube)
  'https://media.retroachievements.org/Images/097988.png', // Pikmin (GameCube)
  'https://media.retroachievements.org/Images/086944.png', // The Simpsons: Hit & Run (GameCube)
  'https://media.retroachievements.org/Images/114344.png', // Paper Mario: The Thousand-Year Door (GameCube)
  'https://media.retroachievements.org/Images/117057.png', // Metroid Prime (GameCube)
  'https://media.retroachievements.org/Images/081531.png', // F-Zero GX (GameCube)
  'https://media.retroachievements.org/Images/101496.png', // Spider-Man (PlayStation)
  'https://media.retroachievements.org/Images/105481.png', // Pokémon Gold Version (Game Boy Color)
  'https://media.retroachievements.org/Images/044233.png', // Sonic Advance (Game Boy Advance)
  'https://media.retroachievements.org/Images/048626.png', // Grand Theft Auto: Liberty City Stories (PlayStation Portable)
  'https://media.retroachievements.org/Images/115716.png', // PaRappa the Rapper 2 (PlayStation 2)
  'https://media.retroachievements.org/Images/115618.png', // Sonic Adventure 2: Battle — GameCube
  'https://media.retroachievements.org/Images/122566.png', // Sonic Adventure DX — GameCube
  'https://media.retroachievements.org/Images/110929.png', // ~Hack~ Pokémon Yellow Legacy — Game Boy
  'https://media.retroachievements.org/Images/109501.png', // Metal Gear Solid — PlayStation
  'https://media.retroachievements.org/Images/131211.png', // Tekken 3 — PlayStation
  'https://media.retroachievements.org/Images/066590.png', // Pepsiman: The Running Hero — PlayStation
  'https://media.retroachievements.org/Images/067095.png', // Castlevania: Chronicles — PlayStation
  'https://media.retroachievements.org/Images/101538.png', // Gran Turismo — PlayStation
  'https://media.retroachievements.org/Images/080437.png', // Harry Potter and the Sorcerer's Stone — PlayStation
  'https://media.retroachievements.org/Images/160909.png', // JoJo's Bizarre Adventure — PlayStation
  'https://media.retroachievements.org/Images/059053.png', // The Legend of Zelda — NES/Famicom
  'https://media.retroachievements.org/Images/064350.png', // Tetris — NES/Famicom
  'https://media.retroachievements.org/Images/060606.png', // Metroid — NES/Famicom
  'https://media.retroachievements.org/Images/103430.png', // Battletoads — NES/Famicom
  'https://media.retroachievements.org/Images/105171.png', // Pokémon Silver Version — Game Boy Color
  'https://media.retroachievements.org/Images/091409.png', // Pokémon Trading Card Game — Game Boy Color
  'https://media.retroachievements.org/Images/112389.png', // Wario Land II — Game Boy Color
  'https://media.retroachievements.org/Images/108280.png', // The Legend of Zelda: Oracle of Ages — Game Boy Color
  'https://media.retroachievements.org/Images/108279.png', // The Legend of Zelda: Oracle of Seasons — Game Boy Color
  'https://media.retroachievements.org/Images/113471.png', // The Legend of Zelda: The Minish Cap — Game Boy Advance
  'https://media.retroachievements.org/Images/157383.png', // ~Hack~ Pokémon Unbound — Game Boy Advance
  'https://media.retroachievements.org/Images/116411.png', // Mario & Luigi: Superstar Saga — Game Boy Advance
  'https://media.retroachievements.org/Images/092736.png', // Pokémon Pinball: Ruby & Sapphire — Game Boy Advance
  'https://media.retroachievements.org/Images/160957.png', // Golden Sun — Game Boy Advance
  'https://media.retroachievements.org/Images/025922.png', // Mega Man Zero — Game Boy Advance
  'https://media.retroachievements.org/Images/093870.png', // Dragon Ball Z: The Legacy of Goku — Game Boy Advance
  'https://media.retroachievements.org/Images/104258.png', // Dragon Ball Z: Shin Budokai — PlayStation Portable
  'https://media.retroachievements.org/Images/047405.png', // Monster Hunter Freedom Unite — PlayStation Portable
  'https://media.retroachievements.org/Images/061474.png', // Tony Hawk's Underground — PlayStation 2
  'https://media.retroachievements.org/Images/056405.png', // Grand Theft Auto: Vice City — PlayStation 2
  'https://media.retroachievements.org/Images/077012.png', // Devil May Cry — PlayStation 2
  'https://media.retroachievements.org/Images/061921.png', // Guitar Hero III: Legends of Rock — PlayStation 2
  'https://media.retroachievements.org/Images/088612.png', // Manhunt — PlayStation 2
  'https://media.retroachievements.org/Images/087306.png', // Prince of Persia: The Sands of Time — PlayStation 2
  'https://media.retroachievements.org/Images/126560.png', // Naruto Shippuden: Ultimate Ninja 5 — PlayStation 2
  'https://media.retroachievements.org/Images/069853.png', // Ape Escape 3 — PlayStation 2
  'https://media.retroachievements.org/Images/078715.png', // Shadow the Hedgehog — PlayStation 2
  'https://media.retroachievements.org/Images/158713.png', // Kingdom Hearts: Final Mix — PlayStation 2
  'https://media.retroachievements.org/Images/076406.png', // The Simpsons Game — PlayStation 2
  'https://media.retroachievements.org/Images/056407.png', // Grand Theft Auto: San Andreas — PlayStation 2
]

/**
 * Steam appids, checked one by one against the store before adding — a wrong
 * id here is a broken tile forever. Cover art, cropped square like the RA
 * boxes so the two platforms sit together in the same collage.
 */
const STEAM_APP_IDS = [
  271590, // Grand Theft Auto V
  374320, // Dark Souls III
  2668510, // Red Dead Redemption
  1817070, // Marvel's Spider-Man Remastered
  22380, // Fallout: New Vegas
  489830, // The Elder Scrolls V: Skyrim Special Edition
  251570, // 7 Days to Die
  813780, // Age of Empires II: Definitive Edition
  933110, // Age of Empires III: Definitive Edition
  1017900, // Age of Empires: Definitive Edition
  33230, // Assassin's Creed 2
  48190, // Assassin’s Creed Brotherhood
  582160, // Assassin's Creed Origins
  289650, // Assassin's Creed Unity
  2379780, // Balatro
  7670, // BioShock
  8850, // BioShock 2
  774361, // Blasphemous
  49520, // Borderlands 2
  729040, // Borderlands Game of the Year Enhanced
  2835570, // Buckshot Roulette
  7940, // Call of Duty 4: Modern Warfare
  42700, // Call of Duty: Black Ops
  202970, // Call of Duty: Black Ops II
  311210, // Call of Duty: Black Ops III
  10180, // Call of Duty: Modern Warfare 2
  504230, // Celeste
  3321460, // Crimson Desert Enhanced
  1091500, // Cyberpunk 2077
  335300, // DARK SOULS II: Scholar of the First Sin
  570940, // DARK SOULS: REMASTERED
  262060, // Darkest Dungeon
  427190, // DEAD RISING
  45740, // Dead Rising 2
  265550, // Dead Rising 3 Apocalypse Edition
  205100, // Dishonored
  454650, // DRAGON BALL XENOVERSE 2
  1790600, // DRAGON BALL: Sparking! ZERO
  1295510, // DRAGON QUEST XI S: Echoes of an Elusive Age - Definitive Edition
  312530, // Duck Game
  239140, // Dying Light
  1245620, // ELDEN RING
  377160, // Fallout 4
  19900, // Far Cry 2
  220240, // Far Cry 3
  298110, // Far Cry 4
  12210, // Grand Theft Auto IV: The Complete Edition
  12220, // Grand Theft Auto: Episodes from Liberty City
  599140, // Graveyard Keeper
  219990, // Grim Dawn
  1145360, // Hades
  1145350, // Hades II
  70, // Half-Life
  220, // Half-Life 2
  219150, // Hotline Miami
  2799860, // INAZUMA ELEVEN: Victory Road
  232090, // Killing Floor 2
  1041720, // Kingdoms of Amalur: Re-Reckoning
  1030830, // Mafia II: Definitive Edition
  1328670, // Mass Effect Legendary Edition
  286690, // Metro 2033 Redux
  287390, // Metro: Last Light Redux
  2246340, // Monster Hunter Wilds
  582010, // Monster Hunter: World
  535520, // Nidhogg 2
  485510, // Nioh: Complete Edition
  275850, // No Man's Sky
  2824660, // Old School Rally
  238320, // Outlast
  400, // Portal
  620, // Portal 2
  1174180, // Red Dead Redemption 2
  418370, // Resident Evil 7 Biohazard
  814380, // Sekiro: Shadows Die Twice - GOTY Edition
  962730, // Skater XL - The Ultimate Skateboarding Game
  646570, // Slay the Spire
  2868840, // Slay the Spire 2
  17390, // SPORE
  32370, // STAR WARS Knights of the Old Republic
  208580, // STAR WARS Knights of the Old Republic II - The Sith Lords
  1286830, // STAR WARS: The Old Republic
  413150, // Stardew Valley
  1049410, // Superliminal
  22330, // The Elder Scrolls IV: Oblivion GOTY
  305620, // The Long Dark
  292030, // The Witcher 3: Wild Hunt
  391540, // Undertale
  1794680, // Vampire Survivors
  230410, // Warframe
]

/** These have no portrait cover on the CDN, so they use the wide header instead. */
const STEAM_HEADER_IDS = [
  15100, // Assassin's Creed: Director's Cut
  201870, // Assassin's Creed Revelations
  911400, // Assassin's Creed III Remastered
  592390, // STAY
  243470, // Watch Dogs
]

const STEAM_IMAGES = [
  ...STEAM_APP_IDS.map((id) => steamAssetUrl(id, 'cover')),
  ...STEAM_HEADER_IDS.map((id) => steamAssetUrl(id, 'header')),
]
const ALL_IMAGES = [...RA_IMAGES, ...STEAM_IMAGES]

const COLUMNS = 4
/** How many of the pool are on screen: enough to fill the columns, few enough
 * that a visit does not download the whole library. */
const TILES_SHOWN = 40
/** Seconds per full pass, one per column: slow enough to read, never matching. */
const COLUMN_SECONDS = [118, 146, 104, 132]
/** Head start per column, so tiles never line up as a grid. */
const COLUMN_OFFSETS = ['-11rem', '4rem', '-6rem', '9rem']
/** Tilt per tile, cycling — not random, so the markup is the same everywhere. */
const ROTATIONS = [8, 6, 11, 5, 9, 7, 10, 4]
/** How far a tile leans off its column's centre line, in rem. */
const ZIGZAG = [4.2, 3.4, 4.6, 3.8]

/** Alternating lean, so a column reads as a zig-zag rather than a straight line. */
function zigzag(column: number, i: number) {
  const side = (i + column) % 2 === 0 ? -1 : 1
  return side * ZIGZAG[i % ZIGZAG.length]
}

const shuffle = (list: string[]) => [...list].sort(() => Math.random() - 0.5)

/**
 * Lays the two platforms out like a checkerboard: going down a column the art
 * alternates between RetroAchievements and Steam, and so does going across.
 * Both libraries are on show wherever you look, instead of in streaks.
 */
function dealBothPlatforms(ra: string[], steam: string[], count: number): string[] {
  const decks = [ [...ra], [...steam] ]
  const deck: string[] = []
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / COLUMNS)
    const wanted = ((i % COLUMNS) + row) % 2
    // Fall back to the other platform once one of them runs out.
    const from = decks[wanted].length ? decks[wanted] : decks[1 - wanted]
    if (!from.length) break
    deck.push(from.shift()!)
  }
  return deck
}

/** Round-robin split, so each column holds a different set of games. */
function intoColumns(images: string[]): string[][] {
  const columns: string[][] = Array.from({ length: COLUMNS }, () => [])
  images.forEach((src, i) => columns[i % COLUMNS].push(src))
  return columns
}

/**
 * The art wall beside the sign-in and register forms: columns of game boxes
 * sliding past each other, the odd ones going up and the even ones down, each
 * at its own speed.
 *
 * Every visit deals a different hand from the pool, and each column's content
 * is doubled so the loop never shows a seam. Hovering stops the column under
 * the pointer; reduced motion stops all of them.
 */
export default function AuthCollagePanel() {
  // A fixed order first, so the server and the first paint agree; a different
  // draw once mounted, so no two visits look the same.
  const [images, setImages] = useState(() => dealBothPlatforms(RA_IMAGES, STEAM_IMAGES, TILES_SHOWN))

  useEffect(() => {
    setImages(dealBothPlatforms(shuffle(RA_IMAGES), shuffle(STEAM_IMAGES), TILES_SHOWN))
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-card">
      {/* subtle accent glow behind images */}
      <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-bg-secondary/60" />

      {/* blend edges into form bg */}
      <div className="absolute inset-y-0 left-0 w-10 z-20 bg-linear-to-r from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 z-20 bg-linear-to-l from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 z-20 bg-linear-to-b from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 z-20 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-start gap-4 px-4">
        {intoColumns(images).map((column, c) => {
          // Doubled so translateY(-50%) always lands on an identical frame.
          const tiles = [...column, ...column]
          return (
            <div key={c} className="flex-1 h-full overflow-hidden">
              <div
                data-column={c}
                className="marquee-column flex flex-col items-center gap-36 hover:[animation-play-state:paused]"
                style={{
                  marginTop: COLUMN_OFFSETS[c % COLUMN_OFFSETS.length],
                  willChange: 'transform',
                  animationName: c % 2 === 0 ? 'marquee-up' : 'marquee-down',
                  animationDuration: `${COLUMN_SECONDS[c % COLUMN_SECONDS.length]}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              >
                {tiles.map((src, i) => (
                  <div
                    key={i}
                    /* Leaning left and right in turn, tilted the way it leans. */
                    style={{
                      transform: `translateX(${zigzag(c, i)}rem) rotate(${
                        Math.sign(zigzag(c, i)) * ROTATIONS[(c + i) % ROTATIONS.length]
                      }deg)`,
                    }}
                  >
                    <div className="bg-bg-tertiary p-1.5 rounded-xl shadow-2xl border border-white/10 hover:scale-110 hover:shadow-accent/25 transition-transform duration-200">
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="w-24 h-24 object-cover rounded-lg"
                        loading="lazy"
                        // A dead URL would otherwise sit as a broken-image icon forever.
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
