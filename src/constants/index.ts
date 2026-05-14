// To add a new console: drop an icon file in /public/media and add an entry here.
// RA console IDs: API_GetConsoleIDs or https://retroachievements.org/APIDemo.php
// name must match ConsoleName returned by the RA API exactly.
export const CONSOLES = [
  { name: 'PlayStation',         id: 12, icon: '/media/ps1.png',      color: 'bg-blue-900/40 text-blue-300'    },
  { name: 'PlayStation 2',       id: 21, icon: '/media/ps2.png',      color: 'bg-indigo-900/40 text-indigo-300' },
  { name: 'PSP',                 id: 41, icon: '/media/psp.png',      color: 'bg-violet-900/40 text-violet-300' },
  { name: 'Game Boy',            id: 4,  icon: '/media/gbc.png',      color: 'bg-slate-700/50 text-slate-300'  },
  { name: 'Game Boy Color',      id: 6,  icon: '/media/gbc.png',      color: 'bg-teal-900/40 text-teal-300'   },
  { name: 'Game Boy Advance',    id: 5,  icon: '/media/gba.png',      color: 'bg-purple-900/40 text-purple-300' },
  { name: 'Nintendo DS',         id: 18, icon: '/media/NDS8.png',     color: 'bg-orange-900/40 text-orange-300' },
  { name: 'GameCube',            id: 16, icon: '/media/GameCube.png', color: 'bg-violet-800/40 text-violet-200' },
  { name: 'Wii',                 id: 19, icon: '/media/wii.png',      color: 'bg-sky-900/40 text-sky-300'     },
  { name: 'Mega Drive',          id: 1,  icon: '/media/Genesis.png',  color: 'bg-zinc-700/50 text-zinc-300'   },
  { name: 'Nintendo 64',         id: 2,  icon: '/media/N64-5.png',    color: 'bg-yellow-900/40 text-yellow-300' },
  { name: 'SNES/Super Famicom',  id: 3,  icon: '/media/SNES.png',     color: 'bg-rose-900/40 text-rose-300'   },
  { name: 'Dreamcast',           id: 40, icon: '/media/dc.png',       color: 'bg-cyan-900/40 text-cyan-300'   },
]

export const CATEGORIES = [
  { label: 'Quiero jugar', slug: 'wantToPlay' },
  { label: 'Estoy jugando', slug: 'playing' },
  { label: 'He completado', slug: 'completed' },
]
