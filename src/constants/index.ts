// To add a new console: drop an icon file in /public/media and add an entry here.
// RA console IDs: API_GetConsoleIDs or https://retroachievements.org/APIDemo.php
// name must match ConsoleName returned by the RA API exactly.
export const CONSOLES = [
  { name: 'PlayStation',         id: 12, icon: '/media/ps1.png',      color: 'bg-console-ps1/40 text-console-ps1-ink'    },
  { name: 'PlayStation 2',       id: 21, icon: '/media/ps2.png',      color: 'bg-console-ps2/40 text-console-ps2-ink' },
  { name: 'PSP',                 id: 41, icon: '/media/psp.png',      color: 'bg-console-psp/40 text-console-psp-ink' },
  { name: 'Game Boy',            id: 4,  icon: '/media/gbc.png',      color: 'bg-console-gb/50 text-console-gb-ink'  },
  { name: 'Game Boy Color',      id: 6,  icon: '/media/gbc.png',      color: 'bg-console-gbc/40 text-console-gbc-ink'   },
  { name: 'Game Boy Advance',    id: 5,  icon: '/media/gba.png',      color: 'bg-console-gba/40 text-console-gba-ink' },
  { name: 'Nintendo DS',         id: 18, icon: '/media/NDS8.png',     color: 'bg-console-nds/40 text-warning' },
  { name: 'GameCube',            id: 16, icon: '/media/GameCube.png', color: 'bg-console-gamecube/40 text-console-gamecube-ink' },
  { name: 'Wii',                 id: 19, icon: '/media/wii.png',      color: 'bg-console-wii/40 text-console-wii-ink'     },
  { name: 'Mega Drive',          id: 1,  icon: '/media/Genesis.png',  color: 'bg-console-megadrive/50 text-console-megadrive-ink'   },
  { name: 'Nintendo 64',         id: 2,  icon: '/media/N64-5.png',    color: 'bg-console-n64/40 text-hardcore' },
  { name: 'SNES/Super Famicom',  id: 3,  icon: '/media/SNES.png',     color: 'bg-console-snes/40 text-console-snes-ink'   },
  { name: 'Dreamcast',           id: 40, icon: '/media/dc.png',       color: 'bg-console-dreamcast/40 text-console-dreamcast-ink'   },
]
