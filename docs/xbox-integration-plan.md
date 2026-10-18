# Xbox integration — análisis y plan

Rama: `feat/xbox-integration` (cortada de `develop`). Estado: **análisis, spike hecho y explorador de administrador**; el resto del plan, pendiente.

> **Estado (2026-10-15).** Fase 0 hecha con una key real (ver sección 6). Está implementado un
> **explorador solo para administradores** en el panel de admin (sin migraciones, sin vincular
> usuarios). Falta decidir el siguiente paso con lo medido. *(Estuvo en pausa del 11 al 15 de octubre
> por la verificación del teléfono de xbl.io.)*

> Fuente del análisis: la web de OpenXBL (xbl.io), el SDK Go no oficial `wolveix/openxbl-go`
> (structs con sus tags JSON) y el código de PSN de este repo. **La documentación pública de
> OpenXBL es muy escasa** (la página `/console` redirige a un `/docs` vacío), así que los mocks de
> las secciones 2 y 3 se reconstruyeron a partir de los structs del SDK. **La sección 6 los corrige
> con respuestas reales**; donde discrepan, manda la 6.

---

## 1. Qué es OpenXBL

Proxy REST no oficial sobre Xbox Live. Te registras en xbl.io con una cuenta Microsoft y te da una
**API key** (`X-Authorization: <key>`). Las llamadas se hacen **como esa cuenta**: puede leer lo que
esa cuenta puede ver (perfiles públicos, o de amigos si es amiga). Igual que PSN: una cuenta de la
app, no la del usuario.

| Plan | Precio | Peticiones/hora |
|---|---|---|
| Free | 0 | **150** |
| Small | 5 $/mes | 500 |
| Medium | 15 $/mes | 2.500 |
| Large | 35 $/mes | 5.000 |

Cabecera `X-RateLimit-Remaining` en las respuestas. Microsoft aplica además sus propios límites
(ráfaga/sostenido) por detrás. Sin atribución obligatoria ni restricción comercial explícita.

### Endpoints que importan (paths según el SDK; ⚠️ verificar)

| Para qué | Endpoint |
|---|---|
| Cuenta de la key | `GET account` |
| Gamertag → XUID | `GET friends/search?gt={gamertag}` ⚠️ |
| Biblioteca de un jugador | `GET titles/{xuid}` (una llamada: título, imagen, logros y gamerscore actuales/totales, `progressPercentage`, `lastTimePlayed`) |
| Logros de un jugador en un juego | `GET achievements/player/{xuid}/{titleId}` |
| Logros del juego (definición) | `GET achievements/title/{titleId}` (paginado con `continuationToken`) |
| Tiempo jugado | `POST player/stats` con stat `MinutesPlayed` (varios títulos por llamada) |
| Presencia | `GET {xuid}/presence` |
| Xbox 360 | `GET achievements/x360/{xuid}/title/{titleId}` (estructura distinta) |

---

## 2. Mock (reconstruido del SDK)

`GET titles/{xuid}` → un elemento:

```json
{
  "titleId": "1144039928",
  "name": "Halo Infinite",
  "type": "Game",
  "devices": ["XboxSeries", "PC"],
  "displayImage": "https://store-images.s-microsoft.com/image/apps.xxxx",
  "achievement": {
    "currentAchievements": 27,
    "totalAchievements": 119,
    "currentGamerscore": 340,
    "totalGamerscore": 1750,
    "progressPercentage": 19
  },
  "gamePass": { "isGamePass": true },
  "titleHistory": { "lastTimePlayed": "2026-09-30T21:14:03Z", "visible": true, "canHide": true },
  "xboxLiveTier": "Gold",
  "isStreamable": false
}
```

`GET achievements/player/{xuid}/{titleId}` → un elemento:

```json
{
  "id": "12",
  "serviceConfigId": "7fe4…",
  "name": "Cuenta atrás",
  "progressState": "Achieved",
  "progression": { "timeUnlocked": "2026-09-12T18:02:44Z" },
  "mediaAssets": [{ "name": "…", "type": "Icon", "url": "https://…" }],
  "isSecret": false,
  "description": "Termina la campaña",
  "lockedDescription": "Termina la campaña",
  "achievementType": "Persistent",
  "rewards": [{ "type": "Gamerscore", "value": "25", "valueType": "Int" }],
  "rarity": { "currentCategory": "Rare", "currentPercentage": 3.4 },
  "isRevoked": false
}
```

⚠️ `progression.timeUnlocked` y `rarity` salen del API oficial de Xbox (achievements v2); el SDK Go
no los modela. Si OpenXBL los pasa tal cual, hay fecha y rareza; si no, ver "Riesgos".

---

## 3. Comparación con PSN

| Aspecto | PSN (hoy) | Xbox vía OpenXBL |
|---|---|---|
| Origen | API móvil no oficial de Sony, librería `psn-api`, directa | API no oficial de Microsoft **a través de un tercero** (xbl.io) |
| Credencial | NPSSO de una cuenta, **caduca a los 60 días**, renovación manual en el admin | API key de xbl.io, **sin caducidad conocida**; OpenXBL mantiene la sesión Microsoft |
| Punto de fallo extra | Sony | Microsoft **+ OpenXBL** (un servicio pequeño; si cae o cambia precios, cae Xbox) |
| Identidad | Online ID → `accountId` (búsqueda universal) | Gamertag → XUID. No prueba propiedad → **no único**, como PSN y Steam |
| Privacidad | Código 2240526 → 403 `private` | Depende de la privacidad Xbox (historial/logros pueden ser "solo amigos") ⚠️ |
| Límite | 429 blando, un reintento a los 2 s | **150/h duras para toda la app**, no por usuario |
| Biblioteca | `getUserTitles` (1+ llamadas) + `getUserPlayedGames` + `trophySetsOf` para tiempo y carátulas | `titles/{xuid}` ya trae progreso y última partida; tiempo aparte (`MinutesPlayed`) |
| Logros de un juego | 2 llamadas (definición + ganados) | 1 llamada (`achievements/player/...`) |
| Puntuación | Trofeos por grado (bronce/plata/oro/platino) | **Gamerscore** y nº de logros; **sin grados ni platino** |
| DLC | Grupos de trofeos → `withBaseGameProgress` | Los logros del DLC van dentro del título: **más simple, no hace falta equivalente** |
| "Completado" | 100 % del juego base | `progressPercentage >= 100` |
| Rareza | `trophyEarnedRate` | `rarity.currentPercentage` ⚠️ |
| Fecha de logro | `earnedDateTime` | `progression.timeUnlocked` ⚠️ |
| Tiempo jugado | `playDuration` ISO 8601 (solo PS4/PS5) | `MinutesPlayed`, otra llamada ⚠️ |
| Arte | Carátula + hero de la Store; IGDB para PS3/Vita | Solo `displayImage`; sin hero → IGDB (ya integrado) o fondo derivado |
| ID de juego | `NPWR20188_00` → entero (`psnNumericId`) | `titleId` ya es numérico, **pero puede pasar de 2³¹** ⚠️ (las columnas `game_id` son `INTEGER`) |
| Consolas antiguas | PS3/Vita igual que el resto | **Xbox 360 usa endpoint y forma distintos** → fuera de la v1 |
| Coste/perfil en frío | ~6-10 llamadas | ~2 + 1 por juego reciente (≈ 7) → **≈ 20 perfiles en frío por hora con Free** |

### Veredicto de encaje: **cuadra bien, con una condición**

- **Encaja en la arquitectura.** La app ya es multi-origen: `GameSource = 'ra' | 'steam' | 'psn'`,
  `GameProgressBase` unificado, caché en `steam_cache` por prefijo, tablas con `CHECK (source IN …)`
  ampliables (migración 025 es la plantilla), enlace por nombre sin probar propiedad (029/028).
- **Se parece más a Steam en datos** (puntos y logros planos, sin grados ni grupos DLC) **y a PSN en
  operativa** (una cuenta de la app, vincular por nombre, la privacidad puede bloquear).
- **La condición es el límite de 150/h.** PSN no tiene un techo así. Con Free solo aguanta pocos
  usuarios; hace falta caché agresiva en Postgres (mismo patrón `withSteamCache`, TTLs largos para
  lo "asentado") y un presupuesto global que degrade a caché vieja / 429 en vez de agotar la key.
  Con ≥ 50 usuarios activos habría que pasar a Small/Medium (5–15 $/mes). **Decisión tuya.**
- **Lo que se pierde frente a PSN:** grados/platino (no existen), hero art, DLC por grupos
  (innecesario). Lo que se gana: 1 llamada por juego en vez de 2, y una credencial que no caduca.

### Riesgos (por orden de gravedad)

1. **Dependencia de un tercero** no oficial. Mitigación: Xbox queda como sección opcional; sin
   `OPENXBL_API_KEY` responde 503 `not-configured` (patrón PSN) y la UI lo dice claro.
2. **Rate limit global.** Mitigación arriba. Medirlo en Fase 0 con `X-RateLimit-Remaining`.
3. **Privacidad Xbox**: un perfil "solo amigos" no se podrá leer. Mitigación: error `private` → 403
   como PSN; el modal de vincular explica cómo ponerlo público.
4. **`titleId` > 2³¹** rompe `INTEGER`. Medir en Fase 0 con cuentas reales; si ocurre, migración a
   `BIGINT` en las 5 tablas (aditiva) — o mapear a un espacio propio.
5. **Campos no confirmados** (rareza, fecha de desbloqueo, tiempo jugado). Si faltan, la UI los omite
   (ya lo hace PSN para PS3/Vita con `playtimeMinutes: null`).
6. **ToS de Microsoft/OpenXBL** sobre datos de terceros: revisar antes de abrir al público y
   actualizar `/privacy` y `/terms` (ya lo exige CLAUDE.md para PSN).

---

## 4. Puntos de contacto en el código

Hoy ~50 archivos de `src/` ramifican por `'psn'`. Los imprescindibles, agrupados:

- **Tipos/ids**: `types/steam.ts` (`GameSource`), `utils/gameRef.ts` (`GAME_SOURCES`, `gameHref`,
  `PLATFORM_NAME`), nuevo `types/xbox.ts` y `utils/xboxTitles.ts` (hermano de `psnTitles.ts`).
- **Servidor**: nuevo `lib/xboxClient.ts` (hermano de `psnClient.ts`: `xboxCall` con retry/429,
  `xboxFailure`, caché `xbox:` en `steam_cache`), rutas `app/api/xbox/{link,unlink,summary,titles,
  achievements,recent}`, `lib/userRecord.ts` (columnas), `lib/publicUser.ts`, admin
  (`api/admin/users/accounts`, `AdminLinkedAccounts`).
- **BD**: migración `031_xbox_columns.sql` (`xboxxuid`, `xboxgamertag`, `favorite_xbox_game`, **no
  únicos**) y `032_xbox_game_source.sql` (CHECK con `'xbox'` en `pinned_games`, `game_group_items`,
  `perfect_games_order`, `hidden_games`; `pinned_achievements` aparte, como hizo 027 para PSN).
- **Cliente**: hooks `useXboxLink/Summary/Titles/…`, contexto `XboxGamesDataContext`,
  `MainPlatformContext` (`'xbox'`), `PlatformLogo`, `MainPageProfile`, `UserPlatforms`,
  `ConnectAccounts`, `library.ts`, `perfectGames.ts`, `groupItems.ts`, `steamFeed.ts`, buscador,
  grupos, pins, favoritos, gráficos.
- **i18n**: strings en los 9 idiomas de `src/translations/`.
- **Legal**: `/privacy`, `/terms`.

---

## 5. Proceso (qué skill en cada fase)

Cada fase termina con `npm test` + lint + build en verde y un commit convencional
(`feat(xbox): …`). Una fase = un PR pequeño a `develop` (squash). **`develop` comparte BD con
producción**: las migraciones de este plan son solo aditivas.

| Fase | Skill | Entregable | Puerta de salida |
|---|---|---|---|
| **0. Spike** | `source-driven-development` | Con una key real: respuestas reales de `titles`, `achievements/player`, `friends/search`, `player/stats`; ids máximos; privacidad con 2-3 cuentas; coste en llamadas. Reemplazar los mocks de este doc por fixtures reales (`src/test-utils/xboxFixtures.ts`). | Los ⚠️ quedan resueltos o descartados. **Sin esto no se empieza la 1.** |
| **1. Spec** | `spec-driven-development` + `interview-me` | `docs/xbox-spec.md`: alcance v1 (One/Series/PC, sin 360), qué se muestra, qué pasa con privado/sin key/límite agotado, plan de pago. | Tu visto bueno al alcance y al gasto. |
| **2. Tareas** | `planning-and-task-breakdown` | Lista ordenada con dependencias y tamaño por tarea. | Cada tarea cabe en un PR revisable. |
| **3. Núcleo** | `test-driven-development` + `incremental-implementation` + `api-and-interface-design` | Migración 031/032 → `xboxClient` (error, retry, caché, presupuesto global) → mappers a `XboxGameProgress` → rutas `link` y `titles`. Tests primero (mappers, errores, rutas happy + error). | Vincular un gamertag y listar su biblioteca en la API. |
| **4. Seguridad** | `security-and-hardening` | Key solo servidor (`OPENXBL_API_KEY`, jamás `NEXT_PUBLIC_`), validación de gamertag/XUID y `encodeURIComponent` en el path, límite de intentos de `link` con `attemptLimit`, nada de secretos en logs. | Revisión sin hallazgos abiertos. |
| **5. UI** | `frontend-ui-engineering` (+ `design-taste-frontend` para la página de juego) | Tarjeta en usuario, perfil, biblioteca, página `/xboxGame/[id]`, chip de gamerscore (no color solo), estados vacío/privado/error/reintento, i18n ×9, toasts. Cumple responsive y WCAG de CLAUDE.md. | Verificado en el navegador (`browser-testing-with-devtools`) en móvil y escritorio. |
| **6. Integración** | `incremental-implementation` | Pins, grupos, perfectos, ocultos, feed reciente, buscador, admin. Un PR por superficie. | Xbox convive con RA/Steam/PSN en cada una. |
| **7. Revisión** | `code-review-and-quality` + `doubt-driven-development` (en `xboxClient` y migraciones) | Revisión multi-eje antes de cada PR a `develop`. | Aprobada. |
| **8. Docs y legal** | `documentation-and-adrs` | ADR "Xbox vía OpenXBL" (alternativa descartada: auth Microsoft directa, frágil), sección Xbox en `CLAUDE.md` como las de PSN/Steam, `/privacy` y `/terms`. | Política actualizada. |
| **9. Lanzamiento** | `shipping-and-launch` + `git-workflow-and-versioning` | Env en Vercel (Preview `develop` primero), migraciones corridas **antes** de mergear, PR `develop`→`main` `chore(release): v1.x.0` (sección nueva = minor). | Checklist y rollback: quitar la key apaga Xbox sin tocar el resto. |

### Alcance recomendado de la v1

Vincular por gamertag · perfil (gamerscore, nº de juegos, avatar) · biblioteca con progreso ·
página de juego con logros (rareza y fecha si existen) · feed reciente · pins/grupos/ocultos/perfectos.
**Fuera**: Xbox 360, amigos, clips/capturas, presencia, "verificado".

### Decisiones abiertas para ti

1. ¿Plan Free (150/h) para empezar, o Small (5 $/mes) desde el principio?
2. ¿Aceptas depender de OpenXBL (tercero no oficial)? La alternativa es autenticar contra Microsoft
   directamente: sin intermediario, pero con tokens que caducan y mucho más trabajo.
3. ¿Xbox 360 fuera de la v1?

---

## 6. Resultados de la Fase 0 (respuestas reales, 2026-10-15)

Probado con una cuenta de 135 juegos. Base real: `https://api.xbl.io/v2/` (no `xbl.io/api/v2`).

| Pregunta | Resultado |
|---|---|
| ¿Biblioteca en una llamada? | **Sí.** `GET titles/{xuid}`: 135 juegos, 131 KB, sin paginación. Incluye juegos de Xbox 360. |
| ¿Gamertag → XUID? | **Sí, en 1 llamada**: `GET friends/search?gt=` devuelve el perfil completo (avatar, gamerscore, tier). `GET account` igual, para la cuenta de la key. |
| Forma del perfil | **No** es el objeto plano del SDK: es `profileUsers[0].settings[]`, pares `{id, value}`, con el gamerscore como texto. |
| ¿Logros de un juego? | **Sí, 1 llamada**: `achievements/player/{xuid}/{titleId}`, 75 logros en 90 KB, con **rareza** (`rarity.currentPercentage` y categoría), **fecha** (`progression.timeUnlocked`; `0001-…` = sin desbloquear) y gamerscore en `rewards`. |
| ¿Xbox 360? | Endpoint propio `achievements/x360/{xuid}/title/{titleId}`, forma plana (`unlocked`, `gamerscore`, `timeUnlocked`, `rarity`). **También trae rareza y fecha**; solo falta la URL del icono. |
| ¿Tiempo jugado? | `POST player/stats` con `MinutesPlayed`: funciona (3409 min en un juego) pero algunos juegos no traen valor. **Sin cablear todavía.** |
| ¿`titleId` > 2³¹? | Máximo visto: 2.142.392.202, **por debajo** de 2.147.483.647. El INTEGER aguanta con esta cuenta; no está garantizado para todas. |
| Errores | **HTTP 200 con el error en el cuerpo** (`{"code":400}`). Hay que mirar el cuerpo. |
| Cabeceras | `Accept-Language: *` (el de Node por defecto) se rechaza: hay que mandar un idioma. |
| Límite | `X-RateLimit-Remaining` / `-Limit` (150) en cada respuesta. |

### Dos trampas en los datos

1. **Totales de logros poco fiables en juegos modernos** (`sourceVersion: 2`, 65 de 135): 49 traen
   `totalAchievements: 0` aunque sí tienen `totalGamerscore` y `progressPercentage` correctos. Hay
   que medir el progreso **por gamerscore**; el total de logros solo sale con la llamada del juego.
2. **107 de 135 juegos no tienen logros** en el resumen (58 con `sourceVersion: 0`); no son un error.

### Coste real por perfil en frío: ≈ 3 llamadas

Búsqueda (1) + biblioteca (1) + logros de un juego (1 por juego abierto). Mejor que el ≈ 7 estimado:
con la caché de Postgres, el plan Free aguanta **unos 50 perfiles en frío por hora**.

### Sigue sin verificar

- **Qué devuelve un perfil privado** (¿403, lista vacía?) y **un gamertag inexistente** (el código lo
  trata como 404 y lo anota en `CLAUDE.md`). Hace falta una cuenta ajena con privacidad cerrada.
- Límite real de `player/stats` por llamada, y si un perfil público de alguien que no es amigo se lee.

### Qué se construyó (solo administradores)

Explorador en el panel de admin: gamertag → perfil, biblioteca con progreso y gamerscore, y logros de
cada juego al abrirlo (con las llamadas que quedan esta hora). `src/lib/xboxClient.ts`,
`src/utils/xboxMappers.ts`, `/api/admin/xbox` y `/api/admin/xbox/achievements`, cada búsqueda queda en
el registro de admin (`xbox-lookup`). Sin migraciones: no toca la base de datos compartida con producción.

## 7. Problema abierto: OpenXBL inaccesible y la app esperando (2026-10-17)

**Pendiente, sin arreglar.** El usuario decidió dejarlo para más adelante.

### Qué se vio
- En local, para un admin con Xbox vinculado, "Jugados recientemente" se quedó ~12 s en
  esqueleto. `/api/xbox/titles` y `/api/xbox/recentAchievements` respondían **502 a los
  ~11,5 s**.
- Causa inmediata: `api.xbl.io` no aceptaba conexiones desde la máquina de desarrollo
  (`UND_ERR_CONNECT_TIMEOUT`; `curl` sin respuesta en 20 s a 188.114.96.5 / 188.114.97.5,
  IPs de Cloudflare), mientras `www.cloudflare.com` respondía en 0,3 s. No era la cuota
  ni nuestro código.
- Sospecha sin confirmar: el bloqueo de IPs de Cloudflare que hacen operadoras españolas
  durante los partidos de LaLiga (era sábado). Para confirmarlo: probar con VPN. En
  producción (Vercel, `fra1`) no debería pasar, pero OpenXBL también puede caerse.

### Por qué duele tanto (lo que sí es nuestro)
1. `xboxCall` (`src/lib/xboxClient.ts`) no tiene timeout: cada llamada espera lo que tarde
   la red en rendirse (~10–11 s).
2. Un fallo no se cachea y no hay *stale-if-error*: `withSteamCache` solo escribe lo que
   sale bien, así que cada visita vuelve a llamar, vuelve a esperar y vuelve a gastar
   cuota. Con la caché caducada, Xbox desaparece entero aunque la última biblioteca buena
   siga en `steam_cache`.
3. `RARecentlyPlayed` espera a todas las plataformas (`xboxLoading` incluido) antes de
   pintar la lista, así que RA, Steam y PSN, ya cargados, esperan a Xbox.

### Arreglo propuesto (rama `fix/xbox-unreachable`, sin empezar)
- `signal: AbortSignal.timeout(~5 s)` en `xboxCall`; el aborto se trata como `failed` (502).
- Si OpenXBL falla, servir la última copia buena de `steam_cache` aunque haya caducado
  (necesita que `readCache` pueda leer filas caducadas).
- Recordar ~60 s por instancia que OpenXBL no responde, para fallar al momento en vez de
  esperar otra vez en cada llamada.
- Que la lista de recientes espere a Xbox como mucho ~2 s y lo añada cuando llegue
  (acepta que se reordene una vez).
