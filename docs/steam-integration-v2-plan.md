# Steam Integration — v2 Plan

## Resumen

**Achievements Tracker** es una app Next.js 14 (App Router) + PostgreSQL + Tailwind v4 que actualmente trackea logros de **RetroAchievements**. La v2 integrará **Steam** para unificar RA + Steam en un solo feed, mostrando juegos recientes de ambas plataformas mezclados con sus diferencias visuales.

### Stack actual

- Framework: Next.js 14 (App Router)
- Auth: NextAuth.js v4 (Credentials Provider + Steam OpenID en v2)
- DB: PostgreSQL vía `pg` pool (Neon)
- Styles: Tailwind CSS v4
- Animations: Framer Motion
- APIs externas: RetroAchievements API + Steam Web API (v2)

## 1. Estado actual (pre-integración)

### Ya existe para Steam (no tocar, ya está preparado)

- Columna `steamid` en tabla `users` ✅
- Columna `steamusername` en tabla `users` ✅
- JWT session lleva `steamid` y `steamusername` (`src/lib/authOptions.ts`) ✅
- Interfaz `User` tiene `steamid?` y `steamusername?` (`src/types/user.ts`) ✅
- `next-auth.d.ts` extiende Session/User/JWT con Steam fields ✅
- Sección Steam en UserData (`src/components/user-data/UserData.tsx`) — **disabled con `opacity-60` + "Coming soon"** ✅
- Traducciones Steam listas en 9 idiomas (strings `signInSteam`, `steamId`, `steamComingSoon`, `profileSt.signIn`) ✅
- Componente `MainPageProfileSt` placeholder ✅
- `mainStart.description` menciona "RetroAchievements and Steam" ✅
- Mecanismo REGISTER_TOKEN reusable para invitaciones ✅

### NO TOCAR las rutas RA existentes

Todas las rutas `/api/get*` existentes llaman a la API de RetroAchievements con caché en memoria (`src/lib/raCache.ts`). NO MODIFICAR. Añadir rutas Steam paralelas.

## 2. APIs de Steam

### Obtener API Key

- URL: https://steamcommunity.com/dev/apikey
- Se necesita cuenta Steam (cualquier cuenta vale)
- La key va en `.env` como `STEAM_API_KEY`
- Es una sola key de servidor, no por usuario

### Autenticación de usuarios (OpenID)

- Steam actúa como proveedor OpenID
- URL del provider: `https://steamcommunity.com/openid`
- NextAuth tiene provider nativo: `import SteamProvider from 'next-auth/providers/steam'`
- El Claimed ID devuelve el SteamID 64-bit del usuario
- El SteamID se guarda en `users.steamid`

### Endpoints Steam necesarios

```
BASE: https://api.steampowered.com

// Perfil del usuario — 1 llamada
GET /ISteamUser/GetPlayerSummaries/v2/?key=KEY&steamids=STEAMID64

// Juegos en propiedad — 1 llamada
GET /IPlayerService/GetOwnedGames/v1/?key=KEY&steamid=STEAMID64&include_appinfo=1&include_played_free_games=1

// Juegos recientes — 1 llamada
GET /IPlayerService/GetRecentlyPlayedGames/v1/?key=KEY&steamid=STEAMID64&count=20

// Logros del usuario para UN juego — 1 llamada por juego
GET /ISteamUserStats/GetPlayerAchievements/v1/?key=KEY&steamid=STEAMID64&appid=APPID&l=spanish

// Definición de logros para UN juego — 1 llamada por juego
GET /ISteamUserStats/GetSchemaForGame/v2/?key=KEY&appid=APPID&l=spanish

// (OPCIONAL) % global de cada logro — 1 llamada
GET /ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=APPID
```

### Formato de respuestas Steam

**GetPlayerSummaries:**
```json
{
  "response": {
    "players": [{
      "steamid": "7656119...",
      "personaname": "Usuario",
      "avatarfull": "https://avatars.steam...",
      "realname": "Nombre Real",
      "loccountrycode": "ES",
      "gameextrainfo": "Counter-Strike 2",
      "gameid": "730"
    }]
  }
}
```

**GetOwnedGames:**
```json
{
  "response": {
    "game_count": 300,
    "games": [{
      "appid": 730,
      "name": "Counter-Strike 2",
      "playtime_2weeks": 120,
      "playtime_forever": 51234,
      "img_icon_url": "fba875cf...",
      "img_logo_url": "fba875cf...",
      "has_community_visible_stats": true
    }]
  }
}
```

**GetPlayerAchievements:**
```json
{
  "playerstats": {
    "steamID": "7656119...",
    "gameName": "Game",
    "achievements": [{
      "apiname": "ACH_WIN_ONE_GAME",
      "achieved": 1,
      "unlocktime": 1700000000,
      "name": "Win a Match",
      "description": "Win your first match"
    }],
    "success": true
  }
}
```

**GetSchemaForGame:**
```json
{
  "game": {
    "gameName": "Game",
    "availableGameStats": {
      "achievements": [{
        "name": "ACH_WIN_ONE_GAME",
        "defaultvalue": 0,
        "displayName": "Win a Match",
        "hidden": 0,
        "description": "Win your first match",
        "icon": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/730/icon_hash.jpg",
        "icongray": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/730/icon_gray_hash.jpg"
      }]
    }
  }
}
```

### URL de imágenes Steam

```
Icono de juego (pequeño): https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{img_icon_url}.jpg
Logo de juego:            https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{img_logo_url}.jpg
Badge de logro (obtenido): {icon del schema}
Badge de logro (bloqueado): {icongray del schema}
```

### Limitaciones de la API Steam

1. **Rate limiting**: ~100-200 llamadas cada 5 minutos. NO hacer batch de todos los juegos. Solo obtener logros para juegos visibles en UI.
2. **`GetPlayerAchievements` necesita perfil público** (Game details: Public en configuración de privacidad de Steam).
3. **`has_community_visible_stats`** indica si un juego tiene logros visibles. Si false, tratar como "sin logros".
4. **Sin hardcore/softcore**: Steam no tiene este concepto. Logro conseguido (1) o no (0).
5. **Sin puntos**: Steam no asigna puntos a logros.
6. **Sin rareza**: Opcionalmente llamar a `GetGlobalAchievementPercentagesForApp`.

## 3. Modelo de datos unificado

### Tipo base

```ts
type GameSource = 'ra' | 'steam'

interface GameProgressBase {
  _source: GameSource
  id: number
  title: string
  imageIcon: string
  consoleName: string
  maxPossible: number
  numAwarded: number
  pctWon: number
  lastPlayed: string | null
}

interface RaGameProgress extends GameProgressBase {
  _source: 'ra'
  hardcoreMode: boolean
  numAwardedHardcore: number
  pointsTotal: number
  pointsEarned: number
  consoleColor?: string
  consoleId: number
  imageTitle: string
  imageIngame: string
  imageBoxArt: string
}

interface SteamGameProgress extends GameProgressBase {
  _source: 'steam'
  playtimeForever: number
  playtime2Weeks: number
  imgLogoUrl: string
  hasStats: boolean
}

type UnifiedGame = RaGameProgress | SteamGameProgress
```

### Achievement

```ts
interface AchievementBase {
  _source: GameSource
  id: string | number
  title: string
  description: string
  dateEarned: string | null
  badgeUrl: string
  displayOrder: number
}

interface RaAchievement extends AchievementBase {
  _source: 'ra'
  points: number
  trueRatio: number
  type: 'progression' | 'win_condition' | 'missable' | null
  dateEarnedHardcore: string | null
  numAwarded: number
  numAwardedHardcore: number
  author: string
}

interface SteamAchievement extends AchievementBase {
  _source: 'steam'
  apiname: string
  hidden: boolean
}

type UnifiedAchievement = RaAchievement | SteamAchievement
```

## 4. Diferencias visuales RA vs Steam

| Funcionalidad RA | En Steam | Que hacer |
|-----------------|----------|-----------|
| Barra dual softcore(azul) + hardcore(amarillo) | No existe | Barra color Steam (`#66c0f4` / `bg-sky-400`) |
| Anillo hardcore en imagenes | No existe | No mostrar |
| Puntos por logro | No existe | No mostrar texto de puntos |
| Total puntos del juego | No existe | No mostrar |
| Rareza (% de jugadores) | Opcional | Llamar a API si se quiere |
| Badge Progression/Win Condition/Missable | No existe | No mostrar |
| Badge Mastery/Completed/Beaten | No existe | Mostrar "100%" verde |
| Rank global RA | No existe | Mostrar nivel Steam |
| Author del logro | No existe | No mostrar |
| Game comments | No existe | No mostrar |
| Game hashes | No existe | No mostrar |
| Subsets (DLC/hubs) | No existe | No aplicar |
| Playtime / horas jugadas | NUEVO | MOSTRAR en Steam (RA no tiene) |
| Icono logro bloqueado/obtenido | Schema da icon + icongray | Mostrar gris si no obtenido |
| Wishlist Steam | Endpoint GetWishlist | Equivalente a "Want to play" |

## 5. Estrategia de carga

### Carga inicial (prioritaria)

1. `GetPlayerSummaries` → nombre, avatar Steam (1 llamada)
2. `GetRecentlyPlayedGames` → ultimos 20 juegos (1 llamada)
3. Para esos juegos: `GetPlayerAchievements` + `GetSchemaForGame` (~20 llamadas)

**Total carga inicial: ~22 llamadas**

### Carga diferida (background)

4. `GetOwnedGames` → biblioteca completa (1 llamada)
5. Clasificar owned games segun logros:
   - Sin logros → "Want to play"
   - Algunos → "Playing"
   - Todos (100%) → "Completed"
6. Para juegos en categorias: achievements bajo demanda (segun scroll)

### Cache

Crear tabla `steam_cache` en DB:
```sql
CREATE TABLE steam_cache (
  user_id INTEGER REFERENCES users(id),
  cache_key TEXT,
  cache_data JSONB,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, cache_key)
);
```

TTLs recomendados:
- Perfil Steam: 15 min
- Owned games: 1 hora
- Recently played: 5 min
- Player achievements: 1 hora
- Schema (definiciones): 24 horas

## 6. Archivos a crear

### Nuevos (~20 archivos)

```
src/types/steam.ts
src/lib/fetchSteam.ts
src/lib/steamCache.ts
src/app/api/steam/getPlayerSummaries/route.ts
src/app/api/steam/getOwnedGames/route.ts
src/app/api/steam/getRecentlyPlayed/route.ts
src/app/api/steam/getAchievements/route.ts
src/app/api/steam/getSchema/route.ts
src/hooks/useSteamRecentlyPlayed.ts
src/hooks/useSteamGamesByCategory.ts
src/hooks/useSteamProfile.ts
src/hooks/useSteamAchievements.ts
src/context/SteamGamesDataContext.tsx
src/components/steam/steam-progress-bar/SteamProgressBar.tsx
src/components/steam/steam-game-item/SteamGameItem.tsx
src/components/steam/steam-game-info/SteamGameInfo.tsx
src/components/steam/steam-profile/SteamProfileSection.tsx
```

### Modificar (~15 archivos)

```
src/types/types.ts                       ← Añadir UnifiedGame, AchievementBase, GameSource
src/types/user.ts                        ← Añadir steamUser?: SteamProfile
src/types/next-auth.d.ts                 ← Añadir steamUser a Session/User/JWT
src/lib/authOptions.ts                   ← Añadir SteamProvider + manejar steamUser
src/components/main-page/MainPage.tsx    ← Mezclar feeds RA + Steam
src/components/main-page/main-page-games/MainPageGames.tsx ← Aceptar UnifiedGame[]
src/components/statusGameList/StatusGameList.tsx           ← Branch por _source
src/components/statusGameList/StatusGameItem.tsx           ← Render condicional
src/components/user-data/UserData.tsx    ← Activar seccion Steam (quitar opacity-60)
src/app/(main)/[category]/page.tsx       ← Fusionar datos RA + Steam
src/app/(main)/allGames/page.tsx         ← Idem
src/translations/en.ts                   ← Añadir strings Steam
src/translations/es.ts                   ← Idem
```

## 7. Colores Steam para UI

```
Steam blue:  #66c0f4  (Tailwind: sky-400)
Steam dark:  #1b2838  (fondo oscuro)
Steam green: #a4d007  (logro 100%)
```

## 8. Posibles problemas y soluciones

| Problema | Solucion |
|----------|----------|
| Perfil Steam privado | Mostrar error: "Tu perfil Steam debe ser publico. Steam -> Editar Perfil -> Privacidad -> Game details: Public" |
| Juego sin achievements | `has_community_visible_stats: false` -> tratar como "Want to play" (0 logros) |
| Rate limiting | Cache en DB con TTL. Solo cargar logros de juegos visibles en UI |
| Steam OpenID no devuelve datos | Despues del OpenID, llamar a GetPlayerSummaries |
| Usuario conecta Steam + RA | Simplemente anadir steamid a su cuenta existente |
| Mismo juego en RA y Steam | Se muestran por separado (diferentes logros). Opcional: deduplicar por titulo |
| Steam API caida | El resto de la app (RA) debe seguir funcionando. Ocultar seccion Steam gracefulmente |

## 9. Dependencias a instalar

```
npm install openid-client
```

O usar `next-auth/providers/steam` si NextAuth v4 lo soporta directamente.

## 10. Orden de implementacion

1. Tipos Steam (`src/types/steam.ts`) + tipos unificados (`types.ts`)
2. Fetch wrapper (`src/lib/fetchSteam.ts`)
3. Cache (`src/lib/steamCache.ts`)
4. Auth Steam OpenID (`authOptions.ts` + `next-auth.d.ts`)
5. API routes Steam (5 rutas)
6. Hooks Steam (4 hooks)
7. Context Steam (`SteamGamesDataContext.tsx`)
8. Componentes Steam (ProgressBar, GameItem, GameInfo, Profile)
9. Integrar en MainPage (mezclar feeds, ordenar por lastPlayed)
10. Activar UserData (quitar opacity-60)
11. Categorias (fusionar RA + Steam)
12. Traducciones
13. Tests (~15 archivos)
