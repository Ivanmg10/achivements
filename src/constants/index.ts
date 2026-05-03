// To add a new console: drop an icon file in /public/media and add an entry here.
// RA console IDs: API_GetConsoleIDs or https://retroachievements.org/APIDemo.php
export const CONSOLES = [
  { name: 'PS1',              id: 12, icon: '/media/ps1.png' },
  { name: 'PS2',              id: 21, icon: '/media/ps2.png' },
  { name: 'PSP',              id: 41, icon: '/media/psp.png' },
  { name: 'Game Boy Color',   id: 6,  icon: '/media/gbc.png' },
  { name: 'Game Boy Advance', id: 5,  icon: '/media/gba.png' },
  { name: 'DS',               id: 18, icon: '/media/NDS8.png' },
  { name: 'GameCube',         id: 16, icon: '/media/GameCube.png' },
  { name: 'Wii',              id: 38, icon: '/media/wii.png' },
  { name: 'Mega Drive',       id: 1,  icon: '/media/Genesis.png' },
  { name: 'Nintendo 64',      id: 2,  icon: '/media/N64-5.png' },
  { name: 'SNES',             id: 3,  icon: '/media/SNES.png' },
]

export const CATEGORIES = [
  { label: 'Quiero jugar', slug: 'wantToPlay' },
  { label: 'Estoy jugando', slug: 'playing' },
  { label: 'He completado', slug: 'completed' },
]
