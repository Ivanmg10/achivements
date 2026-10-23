# Exophase y PSN: ingeniería inversa y comparación con CheevoVault

**Fecha:** 23 de octubre de 2026
**Objetivo:** entender cómo Exophase trata las cuentas de PlayStation Network, compararlo con lo que hace CheevoVault hoy y decidir qué merece la pena construir.
**Método:** observación de páginas públicas, bundles JavaScript públicos, respuestas JSON públicas, documentación y foros de Exophase, y lectura del código de CheevoVault en el commit actual.
**Límites:** no se han saltado protecciones de Cloudflare, no se ha accedido a datos privados y no se propone reutilizar la API, los datos ni los assets de Exophase en producción. Las rutas y fórmulas que aparecen aquí son hallazgos de análisis, no una invitación a copiar su servicio.

---

## 0. Resumen ejecutivo

1. **Exophase no consulta PSN cuando alguien abre un perfil: sirve datos persistidos.** Tiene un modelo de jugador, juegos, definiciones de trofeos y trofeos ganados, alimentado por escaneos en segundo plano. Las páginas son instantáneas y resistentes a que Sony falle o limite.
2. **El vínculo con PSN es por online ID, y la propiedad se demuestra aparte**: el usuario pega un código en el “About Me” de su perfil de PSN y Exophase lo comprueba. Se puede trackear sin verificar, pero algunas funciones y la confianza pública dependen de esa verificación.
3. **Sincronización periódica en segundo plano (el siguiente escaneo puede tardar 4–6 horas), más un escaneo manual** desde la cuenta. La UI muestra `last sync`, trofeos ocultos y estado de baneo. El escaneo manual usa un parámetro de profundidad (`scanDepth`), lo que sugiere una cola con distintos niveles de escaneo.
4. **Modelo de datos muy bien separado:** jugador global (`master_playerid`), jugador por servicio (`service_id`/`canonical_id`), juego global (`master_id`), juego por plataforma (`canonical_id` = `NPWR…`), definición de trofeo (`internal_award_id`) y trofeo de jugador. Eso permite enlazar PS4/PS5/Steam/Xbox del mismo juego y calcular stats globales.
5. **El perfil es un híbrido SSR + JSON inline + Vue:** el HTML trae la cabecera y `window.currentPlayerSummary` / `window.playerGames`; la lista se pinta en cliente. 50 juegos por página, scroll infinito y una API con paginación, búsqueda y orden server-side.
6. **Las páginas de juego sí son SSR completas y públicas**, con la lista de trofeos, rareza, EXP, stats globales y “Platinum Club / 100% Club”. Son la base de su SEO: 242.383 juegos y millones de páginas de trofeos indexables.
7. **Fórmula de EXP reversada y validada:** cada trofeo vale `min(480, redondeo(3300 / rareza))`; los puntos por grado son 15/30/90/300 y el “Obtainable EXP” de un juego es la suma. La completitud de la cabecera es ponderada por puntos, no por número de trofeos.
8. **La clasificación separa platino de 100%:** “Platinum Club” cuenta a quien obtuvo el platino; “100% Club”, a quien completó también los DLC. Es una distinción de producto que CheevoVault hoy no expone con claridad.
9. **Confianza y anti-cheat forman parte del producto:** invalidaciones por juego, reporte, baneo, “Not Ranked” y apelaciones. No es solo tracking; es una competición con reglas.
10. **Su motor de crecimiento son las superficies públicas:** perfiles sin login, páginas de juego/trofeo, leaderboards y gamercards (3,7 millones creadas). El foro y el Discord añaden retención, pero no son lo que se puede copiar.
11. **CheevoVault hoy es un producto de analítica personal y social más rico, pero su PSN es una vista en vivo con caché:** `psnClient.ts` consulta Sony bajo demanda (15 min de caché para resumen/títulos, 30 días para trofeos de un juego, 90 días para sets), y las páginas públicas están detrás de login.
12. **La mejora de mayor ROI no es “parecerse a Exophase”, es convertir PSN en un dataset propio y abrir superficies públicas encima:** sync persistente + verificación de propiedad + páginas SSR de juego/perfil + tarjetas compartibles. Manteniendo la ventaja de CheevoVault: analítica cross-platform, privacidad, puntuación más justa, temas, idiomas y accesibilidad.

---

## 1. Qué es Exophase como producto

Exophase nació en 2006 y trackea logros desde 2011. Hoy declara:

- **3.264.952 jugadores** trackeados.
- **758.483.425 partidas** jugadas.
- **6.323.410.236 trofeos y logros** ganados.
- **3.746.619 gamercards** creadas.
- **7.695.686 logros** y **242.383 juegos** en su base de datos.

Es un producto de datos y comunidad, no solo un panel personal. Su tesis:

> “Un perfil para todas tus plataformas, público, con una tarjeta que puedes poner en cualquier sitio y una clasificación en la que competir.”

Eso explica casi todas sus decisiones técnicas:

- Los datos se guardan y se sirven desde su base de datos, no desde Sony en cada visita.
- Las páginas son públicas y están pensadas para buscadores y para compartir.
- Hay una capa de identidad (verificación) y una capa de competición (reglas, anti-cheat, rankings).
- Hay varias plataformas y un juego global que se enlaza entre ellas.

CheevoVault compite en otra categoría: es mejor panel personal, mejor analítica y mejor experiencia social entre amigos. La comparación útil no es “quién tiene más juegos”, sino **qué capa de datos y qué superficies públicas le faltan a CheevoVault para que su PSN sea igual de sólido y de descubrible**.

---

## 2. Cómo entra PSN en Exophase

### 2.1 Vínculo: online ID + verificación por “About Me”

Sony no ofrece un OAuth público para que una web lea trofeos de un usuario. Exophase usa el mismo patrón que CheevoVault: **una cuenta de PSN de la propia web** lee perfiles públicos. El usuario no entrega su contraseña; solo su online ID. Desde fuera no se puede saber cuántas cuentas de servicio usa Exophase; el modelo implica al menos una, con sesiones gestionadas en servidor.

La diferencia importante es la **verificación de propiedad**:

1. Exophase genera un código.
2. El usuario lo pega en el campo **“About Me”** de su perfil de PSN.
3. Exophase abre el perfil con su cuenta de servicio y comprueba que el código está ahí.
4. Si coincide, la cuenta queda verificada.

Evidencia pública: hilos de soporte de Exophase (“Problems verifying PSN”, “Verifying PSN”, “Manual PSN Verification Request (No Console Access)”) describen exactamente ese flujo: pegar el código en About Me y pulsar “Check About Me”. También hay verificación manual por parte del staff para usuarios sin consola.

Matices que importan:

- **Trackear no exige verificar.** Un perfil no verificado puede mostrar trofeos, pero algunas funciones de la cuenta quedan limitadas (“The features below require verifying your account”, visto en su modal de edición de juego).
- **La verificación es una prueba de identidad, no de propiedad legal de la cuenta.** Reduce la suplantación y el “yo soy Hakoom”, pero no impide que alguien comparta cuenta.
- **El perfil de PSN debe ser público** (Gaming History = Public). Su guía lo explica y recuerda que, tras cambiar la privacidad, hay que esperar al siguiente escaneo o pedir uno manual.

CheevoVault hace lo primero (online ID) pero no lo segundo (verificación). En su código, `psnaccountid` es deliberadamente **no único** y el comentario dice: “nothing proves the account is the user's”. Eso es honesto y evita que un squatter bloquee al dueño, pero deja abierta una vía directa para inflar la clasificación pública: enlazar la cuenta de un top player y heredar sus Vault Points.

### 2.2 Sincronización: escaneos periódicos + escaneo manual

La guía de privacidad de Exophase dice:

> “The site is not immediately notified of any changes in privacy settings — you will either need to wait until the next profile scan (can take up to 4-6 hours) OR go to Edit Profile and click Save Settings to initiate a manual rescan.”

Y en la página de cuenta hay **Tools → manual profile scan**. El JS de la web llama a `POST /account/sync/manual` con `playerId` y `scanDepth=3`, y avisa de que el escaneo corre en segundo plano y puede tardar minutos.

Consecuencias de diseño:

- **La visita no dispara una llamada a Sony.** Se lee de la base de datos.
- **El escaneo es una cola**, no una petición síncrona. Puede tardar; la UI no se bloquea.
- **Hay profundidad**: no todos los escaneos recorren todo el historial. Eso permite onboarding rápido y refrescos baratos.
- **Hay último sync visible** (`lastsync`, `lastsyncFormatted`) y un aviso de trofeos ocultos (`total_hidden`).
- **Puede haber perfiles obsoletos**: el perfil de Hakoom que analizamos mostraba `last sync: 14 dic 2024`, aunque la web seguía sirviendo su histórico. Es el precio de persistir; se mitiga con estados de “stale” y un botón de rescan.

CheevoVault hace lo contrario: la primera visita a un perfil PSN consulta Sony. Tiene caché (15 min para resumen/títulos, 30 días para trofeos de un juego, 90 días para sets), pero **no hay una copia persistente del perfil**. Si Sony limita, falla o el NPSSO caduca, la página depende de la caché y del estado del momento.

### 2.3 Modelo de datos: lo que realmente guarda Exophase

En el HTML del perfil hay un JSON (`window.currentPlayerSummary`) con 55 campos. Los importantes:

| Campo | Ejemplo (Hakoom) | Qué significa |
|---|---:|---|
| `master_playerid` | 292320 | Jugador global de Exophase (el que usa la API pública) |
| `id` | 2483 | Fila del jugador en el servicio PSN |
| `service_id` / `canonical_id` | 6796840136244039860 | ID de cuenta de Sony |
| `environment_player_id` | 2483 | ID del jugador dentro de PSN |
| `username` / `displayname` | Hakoom | Online ID |
| `level` | 2262 | Nivel de Exophase (no el de Sony; PSN tiene tope 999) |
| `total_awards` | 207390 | Trofeos totales |
| `bronze/silver/gold/platinum` | 95496 / 49643 / 54940 / 7311 | Trofeos por grado |
| `earned_points` | 10059630 | Puntos por grado (15/30/90/300) |
| `earned_exp` | 7550374 | EXP dinámica por rareza |
| `possible_awards` | 220100 | Trofeos posibles |
| `progress_points` | 95.89 | % de completitud ponderada por puntos |
| `progress_awards` | 94.23 | % por número de trofeos |
| `progress_average` | 96.22 | Media de progreso |
| `gamesplayed` | 8423 | Juegos con trofeos |
| `completed_games` | 7737 | Juegos completados |
| `playtime` | 43785.41 | Horas (PS4/PS5) |
| `rank_ww` / `rank_country` | 18 / 3 | Ranking mundial / país |
| `psplus` | 1 | PS Plus |
| `region` | us | Región de la cuenta |
| `total_hidden` | 51 | Trofeos ocultos |
| `is_banned` | 0 | Estado de baneo |
| `lastsync` | 1734193123 | Último escaneo |

La lista de juegos (`window.playerGames`) trae 50 juegos por página. Cada juego tiene 28 campos:

- Identidad: `master_id`, `master_playerid`, `meta.canonical_id` (`NPWR33900_00`), `meta.environment_game_id`.
- Progreso: `earned_awards`, `total_awards`, `percent`, `status` (`partial`/`complete`), `completion_date`, `lastplayed`, `firstplayed`, `lastunlock`.
- Trofeos por grado: `earned_bronze/silver/gold/platinum`.
- Tiempo: `playtime`, `playtimeUnits`.
- Privacidad/estado: `privacy`, `isInvalidated`.
- Arte: `resource_standard`, `resource_small`, `resource_tile`.
- Metadatos del juego: `platforms`, `regions`, `developers`, `publishers`, `genres`, `release_date`, `related`, `product_ids`, `links`, `stats`, `slug`, endpoints SEO.

Los `related` son la pieza clave para cross-platform:

```json
"related": [
  { "masterGameId": 472756, "platform": "Steam",  "endpoint": ".../puzzle-quest-3-steam/achievements/" },
  { "masterGameId": 597899, "platform": "PS4",    "endpoint": ".../puzzle-quest-3-psn-2/trophies/" },
  { "masterGameId": 597922, "platform": "Xbox One","endpoint": ".../puzzle-quest-3-xbox/achievements/" }
]
```

Y las stats globales del juego:

```json
"stats": { "players": 3860, "earned_platinum": 341, "earned_awards": 41790, "complete": 125 }
```

Eso es lo que permite mostrar “74.722 jugadores”, “16.575 Platinum Club” y “4.577 100% Club” en la página de FFXVI.

**La lección:** Exophase separa “definición” de “progreso”. La definición de un trofeo se guarda una vez por juego; el progreso se guarda por jugador. CheevoVault, en cambio, vuelve a pedir definiciones y progreso a Sony y los mezcla en la respuesta; no hay una tabla de definiciones reutilizable entre usuarios.

### 2.4 Cómo lo sirve: SSR + JSON inline + API

Rutas públicas observadas:

- `/psn/user/{onlineId}/` — perfil PSN.
- `/user/{username}/` — perfil cross-platform (suma de servicios).
- `/user/{username}/awards/?environment=psn` — parrilla de trofeos.
- `/user/{username}/stats/` y `/psn/user/{onlineId}/stats/` — estadísticas.
- `/game/{slug}/trophies/` — página de trofeos del juego.
- `/game/{slug}/leaderboard/` — leaderboard del juego.
- `/game/{slug}/prices/` — precios.
- `/trophy/{slug}/{id}-{trophySlug}/` — página de un trofeo.
- `/psn/leaderboard/` — leaderboard PSN (protegido por Cloudflare para bots).
- `card.exophase.com/...png` — gamercard.
- `gamercards.exophase.com` — creador de tarjetas.

Arquitectura del perfil:

1. El servidor renderiza la cabecera (hero, avatar, KPIs, tabs) y embebe dos JSON grandes.
2. El cliente (Vue 2 + chunks) pinta la lista, la búsqueda, el orden, los filtros y el scroll infinito.
3. La API devuelve 50 juegos por página con `page`, `environment`, `sort`, `showHidden`, `me` y `query`.
4. Al hacer scroll cerca del final, pide la página siguiente.
5. La búsqueda espera 400 ms y vuelve a pedir desde la página 1.

Endpoints públicos observados en los bundles:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/public/player/{masterPlayerId}/games` | Lista paginada de juegos |
| GET | `/public/player/{id}/awards/list` | Trofeos con filtros de rareza/orden |
| GET | `/public/player/{id}/awards?format=json` | Últimos trofeos |
| GET | `/public/player/{id}/game/{masterGameId}/earned?last=&limit=12` | Trofeos ganados de un juego (con `X-Timezone`) |
| GET | `/public/player/{id}/invalidations` | Juegos invalidados |
| POST | `/public/game/{master_id}/definitions` | Definiciones de trofeos |
| GET | `/public/legacy/get_platforms` | Plataformas |
| GET | `/public/legacy/game/{id}` | Juego legacy |
| POST | `/public/legacy/games/search` | Búsqueda legacy |
| POST | `/account/sync/manual` | Escaneo manual (`scanDepth=3`) |
| POST | `/account/game/edit` | Editar último jugado, horas, progreso, privacidad |
| DELETE | `/account/game/delete/{id}` | Borrar un juego del perfil |
| POST | `/account/upload/psn/trophy` | Subir imagen de trofeo |
| GET/POST | `/account/gamercard` / `/account/update_gamercard` | Gamercard |
| POST | `/account/report` | Reportar |
| GET/POST/DELETE | `/management/player/{id}/ban` | Baneo |
| POST | `/vector/v1/player/{id}/invalidate/{gameId}` | Invalidar un juego |

No todas son accesibles sin sesión; las de `/public/player/...` respondieron a una petición GET con `Origin`/`Referer` de Exophase, salvo `/awards/list`, que devolvió 500 con los parámetros probados. La API está detrás de Cloudflare, con `Access-Control-Allow-Origin: https://www.exophase.com` y credenciales.

**Rendimiento observado** (desde España, 23/10/2026):

| Recurso | Tamaño | Tiempo |
|---|---:|---:|
| Perfil PSN (HTML, 50 juegos inline) | 466.914 B | ~1,06 s |
| Página de juego (HTML SSR) | 125.308 B | ~0,54 s |
| API de 50 juegos | ~56 KB | ~0,29 s |

La cabecera de caché del perfil es `Cache-Control: private, max-age=0, must-revalidate`; la API, `no-cache, private`. Es decir: **no cachean el HTML en el edge**; cada visita renderiza desde su base de datos. Cloudflare está delante, pero sobre todo como WAF/anti-bot, no como CDN de HTML. Las imágenes sí van por `m.exophase.com` / `i.exophase.com` con variantes (`s`, `m`, `l`, `o`, `t`) y un hash de caché.

**Debilidad técnica:** el JSON embebido duplica el `meta` completo del juego en cada juego y en cada trofeo. 50 juegos ocupan cientos de KB. Es cómodo para el cliente, pero desperdicia ancho de banda y hace que el perfil pese más de lo necesario. CheevoVault puede hacerlo mejor con paginación + DTOs ligeros + caché HTTP.

### 2.5 Cómo lo presenta

**Cabecera del perfil PSN**

- Imagen de fondo: una de las imágenes destacadas de los últimos juegos (`headerImages`), no una imagen fija.
- Avatar de PSN, nombre, botón “Report”.
- Nivel Exophase + barra de progreso.
- % de completitud (ponderada por puntos).
- Ranking mundial y de país.
- Trofeos por grado, horas, total de trofeos, juegos, juegos completados, EXP.
- Aviso de trofeos ocultos y “Last profile update”.
- Enlace “View Full Exophase Profile” (perfil cross-platform).

**Lista de juegos**

- 50 por página, fila compacta: portada 127×70, título, chip de plataforma (PS5/PS4/PS3/Vita), horas, trofeos `24/54`, EXP ganada, barra de progreso, contadores por grado, fecha del último jugado.
- Barra de herramientas: búsqueda, “Sort” con 12 opciones (último jugado, último trofeo, primero jugado, logros ganados, fecha de completado, fecha de “beaten”, incompletos, horas, EXP, A-Z, Z-A, aleatorio), filtro de plataforma, opción de ocultos.
- Scroll infinito.
- Panel derecho: “Stats”, “Trophies”, “Rarest Achievements” con 5 trofeos, rareza y fecha.

**Página de trofeos**

- Grid o mosaico.
- Filtros: todas / ganadas / bloqueadas; plataforma; rareza (Ultra Rare, Very Rare, Rare, Uncommon, Common); orden por ganado, rareza o EXP.
- Paginación.
- Cada trofeo: icono, nombre, descripción, grado, rareza, fecha.

**Página de juego**

- Hero con portada, título, plataforma y tabs: Trophies, Leaderboard, Prices, Forum.
- Banda de stats: trofeos ganados, jugadores trackeados, trofeos totales, EXP obtenible, puntos, Platinum Club, 100% Club.
- Tabla de trofeos con icono, nombre, descripción, grado, rareza + EXP, fecha.
- Panel derecho: “My Stats” (login), “Game Info” (publisher, también en, precio, links, idiomas, géneros, fecha), capturas.

**Perfil cross-platform**

- `/user/{name}/` suma todos los servicios y muestra secciones por plataforma; `/psn/user/{name}/` es la vista específica de PSN.

**Gamercards**

- Tres estilos: animada, multiplataforma, una sola plataforma.
- Hasta tres plataformas por tarjeta.
- BBCode, HTML y enlace directo.
- Actualización automática varias veces al día.
- 3,7 millones creadas; es un bucle viral y una fuente de backlinks.

**Leaderboards**

- PSN, Xbox, Steam y cross-platform.
- Ranking mundial y de país; en la cabecera del perfil se ven ambos.
- “Platinum Club” y “100% Club” por juego.

### 2.6 Puntuación: EXP, puntos y niveles

Exophase maneja **dos monedas**:

1. **Puntos por grado** (fijos): bronce 15, plata 30, oro 90, platino 300.
2. **EXP dinámica por rareza**: cada trofeo vale `min(480, redondeo(3300 / rareza))`, usando la rareza con sus decimales internos (el porcentaje que se muestra está redondeado).

Validación empírica con la página de FFXVI (69 trofeos):

| Rareza | EXP mostrada | `3300 / rareza` |
|---:|---:|---:|
| 98,91 % | 33 | 33,36 |
| 90,32 % | 36 | 36,54 |
| 84,03 % | 39 | 39,27 |
| 63,63 % | 52 | 51,86 |
| 38,40 % | 86 | 85,94 |
| 30,81 % | 107 | 107,11 |
| 22,18 % | 148 | 148,78 |
| 6,87 % o menos | 480 (tope) | ≥480 |

La suma de las 69 EXP de la página da **8.511**, exactamente el “Obtainable EXP” que muestra la cabecera del juego. Los puntos suman **1.635**, exactamente su “Points”. Por tanto:

- `Obtainable EXP` = suma de EXP de todos los trofeos.
- `Earned EXP` = suma de EXP de los trofeos ganados.
- `EXP Ratio` = EXP ganada / trofeos totales (Hakoom: 7.550.374 / 207.390 = 36,41).
- La completitud de la cabecera (95,89 %) es **ponderada por puntos**, no por número de trofeos (94,23 %).

Los niveles (2262 en Hakoom) son **de Exophase**, no de Sony: el nivel de PSN tiene tope 999 y Exophase muestra 2262. La curva exacta no es pública; no hace falta copiarla.

**Cómo se compara con Vault Points**

| Dimensión | Exophase EXP | CheevoVault Vault Points |
|---|---|---|
| Unidad | Por trofeo, aditiva | Por juego, tope ~1000 + 20 % bonus |
| Rareza | Absoluta (`3300 / %`) | Relativa al trofeo más común del juego |
| Peso nativo | Puntos por grado (15/30/90/300) | 25 % del valor nativo; el resto rareza |
| Volumen | Ilimitado por juego | Limitado por juego |
| Duplicados (PS4/PS5/regiones) | Cuentan completos | 100 % / 50 % / 10 % según stack |
| Completar | No hay bonus explícito | +20 % |
| Filosofía | Competir por volumen y rareza | Competir por rareza y completitud |
| Volatilidad | Puede bajar cuando la rareza baja | Se recalcula al cambiar el último trofeo |
| Transparencia | Fórmula simple, fácil de explicar | Más compleja, documentada en `/rankings/how` |

Conclusión: **no conviene cambiar Vault Points por EXP**. Vault Points es más justo y evita que el que juega 8.000 juegos de shovelware aplaste al que completa 300 juegos difíciles. Pero Exophase acierta en dos cosas que CheevoVault puede adoptar sin cambiar la puntuación:

- Mostrar **puntos/EXP por juego y por trofeo** en la UI, para que el usuario entienda qué aporta cada trofeo.
- Separar **platino** de **100 % con DLC** en filtros, badges y leaderboards.

### 2.7 Confianza y anti-cheat

Exophase trata el cheating como un problema de producto:

- **Invalidaciones por juego** (`isInvalidated`, `/public/player/{id}/invalidations`): un juego puede marcarse sin banear toda la cuenta.
- **Reporte** desde la cabecera del perfil, solo para cheaters.
- **Baneo** con estado (`is_banned`), “Not Ranked” en la cabecera, y proceso de apelación en el foro.
- **Reglas unificadas** (Unified Achievement Hunting Rules) y política pública.
- **Verificación de PSN** para reducir suplantación.

CheevoVault ya tiene una base buena: `score_games.flag` (`suspect`/`cleared`), detección de unlock tools en Steam (`looksUnlockedByTool`), panel de admin y auditoría. Lo que falta es:

- verificación de PSN antes de entrar en rankings;
- detección de anomalías específicas de PSN;
- flujo público de reporte y apelación;
- estado “no rankeado” visible.

### 2.8 SEO y crecimiento

Exophase es un caso de SEO programático:

- **242.383 juegos** con páginas de trofeos, más páginas de trofeo individuales.
- **3,26 M jugadores** con perfiles públicos.
- Páginas de juego con stats, rareza, “también en”, precio, capturas y foro.
- Metadatos OG dinámicos (título, descripción con último juego, imagen de avatar).
- Sin JSON-LD en las páginas muestreadas (0 `application/ld+json`), lo que deja una oportunidad a CheevoVault.
- No encontramos un `sitemap.xml` válido en la raíz (devolvía HTML), pero su enlazado interno y su volumen de páginas les basta.

CheevoVault hoy tiene ~10 páginas SEO (`/compare/*`, `/track/*`) y un sitemap pequeño. **No tiene páginas públicas de juego PSN ni perfiles públicos sin login.** Eso limita su descubribilidad y su capacidad de convertir visitantes en usuarios.

---

## 3. Fortalezas y debilidades de Exophase

### Fortalezas

1. **Datos persistidos y rápidos.** El perfil no depende de Sony en cada visita.
2. **Modelo de datos cross-platform.** Un juego global con versiones y enlaces entre plataformas.
3. **Superficie pública enorme.** Perfiles, juegos, trofeos, leaderboards y tarjetas.
4. **Verificación de identidad.** Separa “trackear” de “ser el dueño”.
5. **Anti-cheat y reglas.** Rankings con credibilidad y apelaciones.
6. **Gamercards.** Producto viral, gratuito y autoactualizado.
7. **Stats globales por juego.** “74.722 jugadores”, “16.575 platinos”, “4.577 100 %”.
8. **Separación platino / 100 %.** Reconoce dos niveles de completitud.
9. **Comunidad y foro.** Retención y soporte, aunque caro de moderar.
10. **PWA y app instalable.** Presencia fuera del navegador.

### Debilidades

1. **Diseño y UX envejecidos.** Denso, con anuncios, consentimiento y tipografía pequeña.
2. **Inglés only.** Sin internacionalización; CheevoVault tiene 9 idiomas.
3. **Payload inflado.** 50 juegos con `meta` duplicada; cientos de KB.
4. **Perfiles obsoletos.** Sin sync durante meses no hay aviso proactivo claro.
5. **Accesibilidad mejorable.** Vimos `aria-valuenow="{{game.percent}}"` sin renderizar en la barra de progreso; texto pequeño y controles solo con icono.
6. **Trofeos secretos potencialmente espoileados.** El HTML incluye descripciones de trofeos secretos; CheevoVault los oculta hasta ganarlos o revelarlos.
7. **Dependencia de una API no oficial de Sony.** Igual que CheevoVault; el NPSSO caduca y no se puede automatizar el login.
8. **Anti-cheat reactivo.** Reportes y staff; no hay verificación criptográfica de propiedad.
9. **Sin JSON-LD.** Pierde oportunidades de rich results.
10. **Monetización con anuncios y consentimiento.** Peor experiencia que CheevoVault.

---

## 4. CheevoVault hoy: qué hace con PSN

### 4.1 Vínculo

`src/app/api/psn/link/route.ts`:

- Valida el online ID con `^[A-Za-z0-9_-]{3,16}$`.
- Busca la cuenta con `findPsnAccount` (`makeUniversalSearch` + coincidencia exacta de `onlineId`).
- Comprueba que el perfil no sea privado llamando a `psnSummary`.
- Guarda `psnaccountid` y `psnusername` en `users`.
- **No verifica propiedad.** El comentario lo dice: “Nothing proves the account is the user's”.
- **No es único.** Dos usuarios pueden enlazar la misma cuenta PSN.

### 4.2 Credenciales

`src/lib/psnCredentials.ts` + `migrations/026_psn_credentials.sql`:

- Un NPSSO de la app, cifrado con AES-256-GCM y clave derivada de `NEXTAUTH_SECRET`.
- Tokens de acceso/refresh persistidos; renovación por refresh token; si falla, se vuelve al NPSSO.
- El NPSSO caduca a los 60 días; el refresh no lo extiende. Un cron diario (`/api/cron/psnToken`) avisa a los admins 7 días antes.
- `PSN_NPSSO` solo siembra la primera configuración; el panel de admin permite renovarlo sin redeploy.

Esto está bien resuelto y es más explícito que lo que se puede observar en Exophase. **No tocar el modelo de credenciales salvo para añadir observabilidad** (último uso, últimos errores, tasa de 429).

### 4.3 Lectura de datos

`src/lib/psnClient.ts`:

- `psnSummary`: 3 llamadas en paralelo (resumen, títulos con `limit=1`, perfil). Caché 15 min.
- `psnTitles`: `getUserTitles` en páginas de 800; luego `getUserPlayedGames` en páginas de 200 y `getUserTrophiesForSpecificTitle` en lotes de 5 para mapear `CUSA…` → `NPWR…`. Caché 15 min.
- `psnGameGroups` / `psnGameTrophies`: definiciones + ganados; caché 30 días keyed por `lastTrophyAt` (o 90 días para sets).
- `withPlayData`: fusiona la lista de trofeos con la de juegos jugados (horas, última sesión, arte de tienda, colecciones).
- `withIgdbArt`: PS3/Vita sin arte en Sony → IGDB.
- `psnRecentTrophies`: no hay feed en Sony; se construye desde los juegos cuyo último trofeo cae en la ventana, con `PARALLEL = 4`.
- `psnFailure`: 503 no configurado, 403 privado, 429 rate limit, 502 resto.
- Rate limit: un reintento a los 2 s; sin `Retry-After` fiable.

**Coste de una carga fría** para una cuenta grande: 1 llamada de títulos + N/200 de jugados + N/5 de sets (4 en paralelo) + IGDB para PS3/Vita. Para 1.000 juegos, ~200 lotes de sets; para 8.000, ~1.600. Es manejable con caché, pero **no es una arquitectura de datos**; es una vista en vivo.

El análisis específico de capacidad, del único NPSSO y de cómo lo gestionan Exophase, YourGamerProfile y PSNProfiles está en **`docs/psn-scaling-and-rate-limits.md`**. La conclusión: un NPSSO aguanta 10–100 registros/día con cola y onboarding rápido, y 1.000/día si la sincronización completa se aplaza o se reparte entre varias cuentas.

### 4.4 Persistencia

- `steam_cache` guarda respuestas con TTL.
- `score_games` guarda la puntuación Vault por juego (persistida), con `change_key`, `unlocks` por día y `rules_version`.
- `steam_unlocks` guarda unlocks de Steam para streaks/heatmaps.
- **No hay `psn_games`, `psn_trophies`, `psn_player_games`, `psn_player_trophies` ni `psn_unlocks`.**
- `psn` aparece en `score_games`, `pinned_games`, `game_group_items`, `perfect_games_order`, `hidden_games`, `pinned_achievements`, pero no como catálogo de definiciones.

### 4.5 Superficie pública

- `src/proxy.ts` protege todo salvo `/`, `/authPage`, `/resetPassword`, `/privacy`, `/terms`, `/opengraph-image`, `/apple-icon`, `/rankings`, `/rankings/how`, `/compare/*`, `/track/*`.
- `/user/[username]` y `/psnGame/[id]` redirigen a `/authPage` sin sesión (verificado en producción: 200 con URL final `/authPage`).
- La página pública de usuario (`PublicUserPage`) es rica: KPIs de actividad, plataformas, juegos, unlocks recientes, showcase, comparación, follow, grupos, rachas. Pero **solo para usuarios logueados**.
- La tarjeta PSN (`MainPageProfilePsnLinked`) muestra avatar, nivel Sony, PS Plus, About Me, stats, último juego y últimos trofeos. Buen detalle.
- La página de juego PSN (`/psnGame/[id]`) es cliente, depende de la librería del usuario y no existe para un juego que el usuario no haya jugado. No tiene metadata/SEO.
- La página de juego por usuario (`/user/[username]/psn/[NPWR]`) es aún más específica y también privada.

### 4.6 Puntuación

`src/utils/vaultScore.ts`:

- 1.000 puntos por juego, repartidos según rareza relativa y peso nativo (25 %).
- Bonus de +20 % al completar.
- Stacks: 100 % / 50 % / 10 %.
- PSN: `PSN_GRADE = { bronze: 15, silver: 30, gold: 90, platinum: 90 }` (el platino cuenta como oro; el bonus de completitud ya lo premia).
- `psnScoreInputs` usa `t.rarity` (la rareza de Sony) y `earnedAt`.
- `provisionalScore` para juegos aún no leídos.

Esto es más sofisticado y más justo que la EXP de Exophase. **Es una ventaja que hay que proteger y explicar mejor**, no reemplazar.

### 4.7 Fortalezas de CheevoVault

- Analítica cross-platform muy superior: heatmap, rachas, mejores periodos, distribución de completitud, juegos perfectos/casi, hábitos, comparación mensual.
- Grupos, follows, feed, showcase, comparación de juegos, perfiles públicos opt-in.
- 25 temas, 9 idiomas, foco en accesibilidad, sin anuncios.
- Nivel de Sony + nivel Vault; CheevoVault muestra el nivel real de PSN, Exophase lo sustituye por el suyo.
- Trofeos ocultos: se ocultan hasta ganarlos o revelarlos; mejor que Exophase.
- Exportación “Ask an AI” por juego; Exophase no tiene equivalente.
- Puntuación más justa y documentada.
- Caché y manejo de errores de PSN bien pensados.

### 4.8 Debilidades frente a Exophase

- PSN no persistido; la página depende de Sony.
- Sin verificación de propiedad; riesgo de manipulación de rankings.
- Sin páginas públicas/indexables de juego/perfil.
- Sin stats globales por juego ni clubs.
- Sin leaderboards por juego ni lente PSN en rankings.
- Sin gamercards ni imágenes OG por usuario/juego.
- Sin “last synced”/rescan visible.
- Sin historial PSN persistido (equivalente a `steam_unlocks`).
- Sin reporte/apelación pública ni detección de anomalías PSN.
- Payload de la librería completa (sin paginación server-side).

---

## 5. Comparativa directa

| Dimensión | Exophase | CheevoVault hoy | Quién gana | Acción recomendada |
|---|---|---|---|---|
| Vínculo PSN | Online ID + verificación About Me | Online ID, sin prueba | Exophase | Añadir verificación opcional y exigirla para rankings |
| Sync | Escaneo periódico (hasta 4–6 h de espera) + manual, persistido | Bajo demanda + caché 15 min | Exophase | Snapshot persistente + cola de sync |
| Datos guardados | Jugador, juegos, definiciones, trofeos, stats | Caché + `score_games` | Exophase | Tablas `psn_*` |
| Perfil público | Sí, sin login | Solo con login | Exophase | Abrir lectura pública opt-in |
| Páginas de juego | SSR, públicas, indexadas | Cliente, privadas, dependientes del usuario | Exophase | Páginas canónicas SSR |
| Stats globales | Jugadores, platinos, 100 %, EXP | No | Exophase | Agregados desde el snapshot |
| Rareza por trofeo | Sí (Sony) | Sí (Sony) | Empate | Mantener; añadir histórico |
| Grupos DLC | Sí | Sí, con mejor UI | CheevoVault | Mantener y añadir filtros 100 % |
| Trofeos ocultos | Descripciones en HTML | Ocultos hasta revelar | CheevoVault | Mantener |
| Completitud | Ponderada por puntos + clubs | `pctWon` de Sony + preferencia platino | Empate | Exponer platino vs 100 % |
| Puntuación | EXP aditiva por rareza | Vault Points por juego | CheevoVault | Mantener; mostrar desglose |
| Nivel | Propio (2262) | Sony (máx. 999) + Vault | CheevoVault | Mantener ambos |
| Analítica | Básica mensual | Heatmap, rachas, hábitos, distribución | CheevoVault | Mantener |
| Social | Foro, leaderboards, cards | Follows, grupos, comparación, showcase | Empate | Añadir leaderboards por juego |
| Gamercards | 3 estilos, BBCode/HTML, 3,7 M | OG genérico | Exophase | Cards dinámicas |
| Anti-cheat | Invalidaciones, reporte, ban, apelación | Flags admin + detección Steam | Exophase | Verificación + anomalías PSN + reporte |
| SEO | 242 k juegos, millones de trofeos | ~10 páginas | Exophase | Sitemap de juegos/perfiles, JSON-LD |
| Idiomas | Inglés | 9 idiomas | CheevoVault | SEO localizado (ES/PT primero) |
| Privacidad | Ads/consent, datos públicos por defecto | Opt-in, sin ads | CheevoVault | Mantener |
| Accesibilidad | Mejorable | Fuerte | CheevoVault | Mantener |
| Rendimiento | Instantáneo desde DB, pero HTML pesado | Depende de Sony, payload completo | Exophase | DB + paginación + DTOs |

### 5.1 Qué no copiar

- **El foro.** Es un producto y un coste de moderación; CheevoVault ya tiene Discord y follow/feed. No lo abras para “tener comunidad”.
- **Los anuncios y el muro de consentimiento.** La experiencia limpia es una ventaja; no la cambies por unos ingresos marginales.
- **El secreto a voces de los trofeos ocultos.** Mantén la ocultación hasta ganar/revelar; es mejor que Exophase.
- **La EXP aditiva sin tope por juego.** Premia volumen y shovelware; Vault Points ya resuelve eso mejor.
- **El HTML con cientos de KB de JSON duplicado.** Pagina y sirve DTOs ligeros.
- **El “todo público por defecto”.** En PSN los trofeos son públicos, pero publicar un perfil en CheevoVault debe ser una decisión explícita.
- **Sus endpoints o su base de datos.** Análisis competitivo, no fuente de datos; respeta sus términos y su Cloudflare.

---

## 6. Plan de mejora priorizado

La regla: **cada fase debe dejar una mejora visible para el usuario y una métrica que se pueda medir.** No construir “porque Exophase lo tiene”.

### P0 — Integridad y superficie pública (1–2 semanas)

#### P0.1 Verificación de propiedad de PSN (la más urgente)

**Por qué:** hoy cualquiera puede enlazar la cuenta de Hakoom y heredar sus Vault Points. Eso rompe la credibilidad de `/rankings`, que ya es público. Exophase lo resuelve con About Me; es el precedente correcto.

**Qué construir:**

- Migración: `users.psn_verified_at`, `users.psn_verification_code`, `users.psn_verification_expires_at`.
- Al enlazar (o desde la tarjeta PSN), generar un código corto (`CV-7F3K9Q`) y mostrar instrucciones: PSN → Perfil → About Me → pegar → guardar.
- `POST /api/psn/verify`: obtiene el perfil con `getProfileFromAccountId` y comprueba `aboutMe` (trim, case-insensitive). Si coincide, marca verificado y borra el código.
- Código válido 24 h; máximo 3 comprobaciones cada 10 min; botón “Check About Me”.
- Estado en la UI: “Verificado” / “Sin verificar” con explicación; opción de saltar.
- **Rankings:** solo cuentan cuentas PSN verificadas. Los no verificados pueden usar la app, pero aparecen como “No rankeado” y no suman a la clasificación pública.
- **Periodo de gracia:** 30 días con aviso y badge “Sin verificar” antes de excluirlos; los admins pueden verificar manualmente a quien no tenga consola.
- Admin: poder verificar manualmente y revocar.
- Badge público solo si el usuario quiere; por defecto, mostrar “Verificado” en el perfil.

**Dónde:** `migrations/`, `src/lib/psnClient.ts` (helper de verificación), `src/app/api/psn/verify/route.ts`, `src/components/user-page/user-psn-card/`, `src/lib/scoreRefresh.ts` / `src/lib/rankings.ts` (filtro de verificación), `src/utils/vaultScoreInputs.ts` si hace falta.

**Riesgo:** Sony puede bloquear textos raros en About Me (hay casos en el foro de Exophase). Mitigación: código corto y “solo letras/números”, instrucciones claras, verificación manual, no bloquear el tracking si falla.

**Métrica:** % de cuentas PSN verificadas; reducción de cuentas duplicadas; reportes de suplantación.

#### P0.2 Abrir perfiles públicos (lectura, opt-in)

**Por qué:** sin login no hay descubrimiento, ni compartir, ni SEO. Exophase lleva 15 años viviendo de esto.

**Qué construir:**

- `GET /api/public/user/[username]` sin sesión, solo si `profilePublic` y no baneado.
- `dataOwner` público (o un `publicDataOwner`) que no permita escrituras ni datos privados.
- Rutas públicas `/u/[username]` (o `/user/[username]` sin redirect) y `/psn/[onlineId]` con canonical a `/u/[username]` solo si verificado; si no, `noindex`.
- `noindex` para perfiles privados, sin juegos o con datos incompletos.
- Rate limit y caché `s-maxage=60, stale-while-revalidate=300`.
- Botón “Crear mi CheevoVault” en la cabecera; CTA al final.
- Moderación: reporte de perfil, `robots`/`noindex` por usuario, y un `profilePublic` por defecto **false** (ya existe).
- OG image por usuario (ver P2.1; se puede adelantar como parte de P0.2).

**Dónde:** `src/proxy.ts`, `src/lib/apiAuth.ts`, `src/app/api/users/[username]/route.ts`, `src/app/api/public/`, `src/components/public-user-page/`, `src/app/(main)/user/[username]/page.tsx`.

**Riesgo:** contenido generado por usuarios y PSN IDs ajenos. Mitigación: opt-in, verificación para indexar por PSN ID, reporte, y límites.

**Métrica:** sesiones orgánicas, perfiles vistos sin login, signups atribuidos a `/u/*` y `/psn/*`.

#### P0.3 Paginación server-side de la librería PSN

**Por qué:** `GET /api/psn/titles` devuelve **toda** la librería. Para 1.000 juegos son cientos de KB y mucho trabajo de cliente; Exophase devuelve 50 por página.

**Qué construir:**

- `/api/psn/titles?page=1&limit=50&q=&sort=lastPlayed|lastTrophy|hours|completion|alpha|random&platform=ps5|ps4|ps3|vita&status=all|playing|completed|incomplete`
- Respuesta `{ items, page, total, hasMore, nextCursor }`.
- El cliente (`PsnGamesDataContext`, `PublicUserGames`) usa scroll infinito o “show more” de 50.
- Mantener un endpoint `full=1` solo para cálculos internos (stats, puntuación) y para la primera carga del panel, si hace falta.

**Dónde:** `src/app/api/psn/titles/route.ts`, `src/context/PsnGamesDataContext.tsx`, `src/components/public-user-page/public-user-games/`, `src/components/library-*`.

**Riesgo:** romper consumidores que esperan un array. Mitigación: versionar (`?v=2`) o devolver un objeto y adaptar los hooks; tests.

**Métrica:** peso de la respuesta, tiempo hasta el primer juego, memoria del cliente.

#### P0.4 “Last synced”, rescan y estados de error

**Por qué:** el usuario no sabe si sus trofeos están al día; Exophase lo muestra y permite rescan. CheevoVault solo tiene un botón de refresh que vuelve a pedir a Sony.

**Qué construir:**

- `users.psn_last_synced_at`, `users.psn_sync_requested_at`, `users.psn_sync_status` (`idle`/`queued`/`running`/`error`), `users.psn_sync_error`.
- En la tarjeta PSN: “Actualizado hace 12 min” + botón “Actualizar” (rate limit 1/10 min) que encola y devuelve 202.
- Un worker (cron o ruta protegida) procesa la cola; mientras, la UI muestra “Actualizando…” y los datos anteriores.
- Persistir el último error (`private`, `rate-limited`, `token-expired`) y mostrar un mensaje accionable.
- No borrar datos buenos si el sync falla.

**Dónde:** `migrations/`, `src/lib/psnClient.ts`, `src/app/api/psn/`, `src/components/main-page/main-page-profile/main-page-profile-psn/`, `vercel.json`.

**Métrica:** % de perfiles con sync < 6 h; tiempo medio de rescan; errores por tipo.

#### P0.5 Platino vs 100 % (DLC) y filtros

**Por qué:** Exophase separa “Platinum Club” y “100% Club”. CheevoVault tiene una preferencia (`platinumCompletes`) pero no lo hace visible como dos estados.

**Qué construir:**

- Badges: “Platino” (base + platino) y “100 %” (todo, DLC incluido).
- Filtros en la librería: “Platinos”, “100 %”, “Con DLC pendiente”.
- En la página de juego: “Te falta el DLC X” y “Platino conseguido, 100 % pendiente”.
- En stats: cuenta de platinos vs 100 %.

**Dónde:** `src/utils/psnTitles.ts` (`classifyPsnGame`), `src/components/psn/`, `src/components/library-*`, `src/components/public-user-page/`.

**Métrica:** uso de filtros; juegos con DLC completados; satisfacción.

#### P0.6 Accesibilidad y detalles que Exophase hace mal

- `aria-valuenow` real en las barras (Exophase lo deja como plantilla sin renderizar).
- Porcentaje textual además de la barra.
- Nombres accesibles en botones solo-icono.
- No espoilear trofeos ocultos.
- Foco visible y navegación por teclado.

**Métrica:** auditoría Lighthouse/axe sin errores críticos.

### P1 — Capa de datos PSN (4–6 semanas)

#### P1.1 Esquema persistente

Migraciones nuevas (numeración siguiente):

```sql
-- Catálogo global de juegos PSN (una fila por NPWR)
CREATE TABLE psn_games (
  npwr             TEXT PRIMARY KEY,              -- 'NPWR20188_00'
  name             TEXT NOT NULL,
  platform         TEXT,                          -- PS5/PS4/PS3/PS Vita
  icon_url         TEXT,
  cover_url        TEXT,
  hero_url         TEXT,
  concept_id       BIGINT,
  release_date     DATE,
  total_trophies   INT NOT NULL DEFAULT 0,
  total_points     INT NOT NULL DEFAULT 0,
  total_exp        INT NOT NULL DEFAULT 0,
  has_platinum     BOOLEAN NOT NULL DEFAULT FALSE,
  dlc_groups       INT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Definiciones de trofeos (una fila por trofeo y NPWR)
CREATE TABLE psn_trophies (
  npwr        TEXT NOT NULL REFERENCES psn_games(npwr) ON DELETE CASCADE,
  trophy_id   INT NOT NULL,
  group_id    TEXT NOT NULL DEFAULT 'default',
  grade       TEXT NOT NULL CHECK (grade IN ('bronze','silver','gold','platinum')),
  name        TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  icon_url    TEXT,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  rarity      NUMERIC(5,2),
  exp         INT,
  PRIMARY KEY (npwr, trophy_id)
);

-- Estado del jugador (uno por usuario)
CREATE TABLE psn_players (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_id       TEXT NOT NULL,
  online_id        TEXT NOT NULL,
  avatar_url       TEXT,
  about_me         TEXT,
  is_plus          BOOLEAN,
  trophy_level     INT,
  tier             INT,
  level_progress   INT,
  region           TEXT,
  verified_at      TIMESTAMPTZ,
  last_synced_at   TIMESTAMPTZ,
  next_sync_at     TIMESTAMPTZ,
  sync_status      TEXT NOT NULL DEFAULT 'idle',
  sync_error       TEXT
);

-- Progreso por juego (una fila por usuario y NPWR)
CREATE TABLE psn_player_games (
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  npwr             TEXT NOT NULL REFERENCES psn_games(npwr) ON DELETE CASCADE,
  earned           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {bronze,silver,gold,platinum}
  defined          JSONB NOT NULL DEFAULT '{}'::jsonb,
  percent          NUMERIC(5,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'in_progress',
  playtime_minutes INT,
  last_played_at   TIMESTAMPTZ,
  last_trophy_at   TIMESTAMPTZ,
  first_played_at  TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  hidden           BOOLEAN NOT NULL DEFAULT FALSE,
  invalidated      BOOLEAN NOT NULL DEFAULT FALSE,
  raw              JSONB,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, npwr)
);

-- Trofeos ganados (solo los ganados; las definiciones ya están arriba)
CREATE TABLE psn_player_trophies (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  npwr       TEXT NOT NULL,
  trophy_id  INT NOT NULL,
  grade      TEXT NOT NULL CHECK (grade IN ('bronze','silver','gold','platinum')),
  earned_at  TIMESTAMPTZ NOT NULL,
  rarity     NUMERIC(5,2),
  exp        INT,
  PRIMARY KEY (user_id, npwr, trophy_id),
  FOREIGN KEY (npwr, trophy_id) REFERENCES psn_trophies(npwr, trophy_id) ON DELETE CASCADE
);

-- Cola de sync (opcional; también se puede derivar de psn_players)
CREATE TABLE psn_sync_jobs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,               -- 'link' | 'cron' | 'manual'
  status      TEXT NOT NULL DEFAULT 'queued',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error       TEXT,
  stats       JSONB
);
```

Índices:

```sql
CREATE INDEX psn_player_games_recent ON psn_player_games (user_id, last_played_at DESC);
CREATE INDEX psn_player_games_trophy ON psn_player_games (user_id, last_trophy_at DESC);
CREATE INDEX psn_player_trophies_recent ON psn_player_trophies (user_id, earned_at DESC);
CREATE INDEX psn_trophies_rarity ON psn_trophies (npwr, rarity);
```

Nota: `psn_player_trophies` puede crecer mucho (Hakoom: 207 k filas). Para la escala de CheevoVault es asumible; guardar solo los ganados, no todos los posibles. El sync debe escribir primero `psn_games`/`psn_trophies` y después `psn_player_trophies`, para que la FK compuesta no falle. `psn_games` es una fila por set (`NPWR`); el juego maestro que agrupa PS4/PS5/Steam se añade en P2.6.

#### P1.2 Historial y feeds

No hace falta duplicar la tabla. Si `psn_player_trophies` guarda **solo los trofeos ganados** (que es lo que se consulta para feeds y rachas), esa misma tabla es el historial:

- `SELECT … WHERE user_id = $1 ORDER BY earned_at DESC` para “últimos trofeos”.
- `GROUP BY date_trunc('day', earned_at)` para heatmap y rachas.
- `ORDER BY rarity` para “trofeo más raro del año”.
- Índice `(user_id, earned_at DESC)`.

Si en el futuro se quiere separar la retención (por ejemplo, borrar trofeos antiguos pero conservar agregados), se puede añadir `psn_unlocks` como tabla de eventos o una vista materializada; no lo hagas al principio. La regla de CheevoVault es no añadir una tabla hasta que haya una consulta que la necesite.

Al desenlazar PSN, borrar `psn_player_trophies`, `psn_player_games` y `psn_players` (las tres caen por `ON DELETE CASCADE` si se borra al usuario, pero el desenlace no borra al usuario). Añadir también `DELETE FROM score_games WHERE user_id = $1 AND source = 'psn'`; hoy `unlink` limpia la caché y los campos de usuario, pero **no borra `score_games`**. Las queries de rankings lo excluyen por `LINKED_ACCOUNT`, pero es mejor no conservarlo.

#### P1.3 Sync worker

Flujo propuesto:

```
on link:
  verify optional -> enqueue full sync
  UI responde al instante con "preparando tu perfil"

cada 6 h (cron):
  seleccionar usuarios con psnaccountid y next_sync_at <= now()
  ordenar por last_seen / last_synced
  presupuesto global (p. ej. 300 llamadas/hora)
  por usuario:
    summary (1)
    titles (1 por 800)
    played games (1 por 200)
    sets nuevos (5 ids por llamada)
    trofeos solo de juegos con lastTrophyAt cambiado
  guardar en transacción por usuario
  marcar last_synced_at / next_sync_at
  si falla: guardar error, mantener datos anteriores, backoff
```

Reglas:

- **Definiciones globales primero:** `psn_games`/`psn_trophies` se piden una vez por NPWR y se comparten entre todos los usuarios. Es el mayor ahorro.
- **Progresivo en el primer sync:** 100 juegos recientes ahora; el resto en segundo plano. El usuario ve su perfil en segundos.
- **Presupuesto global:** una sola cuenta NPSSO para toda la app; hay que respetar 429 y no paralelizar de más. `PACE.psn` ya existe en `scoreRefresh` (2 concurrentes, 100 por pasada); reutilizar esa idea.
- **Stale-while-revalidate:** servir DB; si `last_synced_at` > 6 h, mostrar “actualizando” y encolar; nunca bloquear la página.
- **Observabilidad:** contadores de llamadas, 429, latencia, errores por tipo; alerta si el NPSSO caduca.

#### P1.4 Páginas canónicas SSR de juego

**Por qué:** es el mayor hueco de SEO. Exophase tiene 242 k páginas; CheevoVault no tiene ninguna pública de PSN.

**Qué construir:**

- `/psn/game/[npwr]` (o `/juego/[slug]`) server component:
  - Datos de `psn_games` + `psn_trophies`.
  - Stats globales de CheevoVault (`count` de `psn_player_games`, platinos, 100 %, media de completitud).
  - Lista de trofeos con rareza y EXP.
  - Si hay sesión, overlay de progreso del usuario; si no, CTA “Conecta tu PSN para ver tu progreso”.
  - “También en” (PS4/PS5/Steam/Xbox) si hay mapping.
  - Screenshots/IGDB, release date, publisher.
  - JSON-LD `VideoGame` + `BreadcrumbList`; OG image dinámica.
- `/psn/game/[npwr]/trophies` puede ser la misma página con anchor; no crear URLs duplicadas.
- Sitemap de juegos (`/sitemap-games.xml`) con `lastmod`; enviar a Search Console.
- hreflang para los 9 idiomas; empezar por ES/EN.

**Riesgo:** thin pages si no hay definiciones. Mitigación: indexar solo juegos con `psn_games.total_trophies > 0` y al menos X datos; `noindex` el resto.

**Métrica:** páginas indexadas, impresiones/clics, signups desde páginas de juego.

#### P1.5 Stats globales, clubs y leaderboards por juego

- En cada juego: jugadores CheevoVault, platinos, 100 %, media de completitud, media de horas, trofeo más raro y % de usuarios que lo tienen.
- “Platinum Club” / “100% Club” con avatares y fechas.
- Leaderboard del juego por Vault Points y por fecha de completado.
- En el perfil: “X juegos en común”, “tu ranking en este juego”.

Esto convierte la base de datos en comunidad y da razones para volver.

#### P1.6 Lente PSN en rankings

- Filtros: plataforma (PSN/Steam/RA), país, solo verificados, solo 100 %.
- Ranking por Vault Points, por platinos, por completitud media, por EXP (opcional).
- Rank de país en la cabecera del perfil (Exophase lo tiene; CheevoVault ya guarda país).
- “Mi posición” y flechas semanales (ya existe en rankings).

### P2 — Diferenciación y escala (trimestre)

1. **Gamercards dinámicas** (`/card/[username].png`): avatar, nivel Vault, trofeos por grado, % completitud, último juego, trofeo más raro, tema. BBCode/HTML/direct link. `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`. Esto es barato con `next/og` y tiene un retorno viral enorme.
2. **Anti-cheat PSN:** reglas de anomalías (trofeo antes de fecha de lanzamiento, timestamps futuros, ráfagas entre juegos distintos, paquetes de trofeos incompatibles), revisión humana, `invalidated`, “No rankeado”, reporte y apelación. No banear por una sola señal.
3. **Presence / now playing:** si `psn-api` lo permite, mostrar “Jugando a X” y última conexión; si no, usar el último juego con `lastPlayed` y un aviso de “puede no ser en vivo”. No prometer tiempo real si no lo es.
4. **Proxy de imágenes PSN:** cachear iconos/avatares/fondos en un endpoint propio con allowlist y `Cache-Control` largo; servir WebP/AVIF; evitar depender de `psnobj` en cada visita.
5. **Correcciones manuales y juegos ausentes:** permitir editar horas/fecha de último jugado (como Exophase) y añadir un juego PS3/Vita que Sony no liste; marcar como “manual”.
6. **Catálogo maestro de juegos:** tabla `games` + `game_versions` con IDs externos (NPWR, Steam appid, RA game id, Xbox title id), para “también en”, stacks y páginas únicas. Empezar por PSN/Steam; IGDB como fuente de mapping.
7. **SEO localizado:** ES/PT primero. Títulos como “Trofeos de [juego] — guía, rareza y progreso”; hreflang; contenido generado desde definiciones + AI export. Evitar duplicar texto automático sin valor.
8. **Recap anual PSN:** “tu año en trofeos”, con heatmap, platinos, juego más raro y tarjeta compartible. Exophase no lo tiene; CheevoVault ya tiene los datos.

---

## 7. Diseño propuesto: perfil PSN

```
┌──────────────────────────────────────────────────────────────┐
│ Hero: arte del último juego + degradado                      │
│ [avatar] Online ID  [Verificado]  [PS Plus]  [País]          │
│ Nivel Sony 512 · Nivel Vault 47 · 82 % completitud            │
│ 1.240 juegos · 98 platinos · 64 100 % · 3.450 h · #12 ES     │
│ Última sync: hace 12 min  [Actualizar]                       │
├───────────────────────────────┬──────────────────────────────┤
│ Buscar [........]  Orden ▼    │ Rarest trophies (5)          │
│ Plataforma: Todas PS5 PS4...  │  - nombre · 0,4 % · fecha    │
│ Estado: Todos Platino 100 %   │                              │
│ ┌───────────────────────────┐ │ Recent unlocks (5)           │
│ │ [cover] Juego       PS5   │ │  - trofeo · juego · fecha    │
│ │ 120 h · 24/54 · 44 %      │ │                              │
│ │ ███████░░░  🥉14 🥈8 🥇2  │ │ Cerca del platino            │
│ │ Último: 13 dic 2024       │ │  - juego · 92 % · 2 trofeos  │
│ └───────────────────────────┘ │                              │
│ ... 50 por página ...         │ Backlog roulette [Jugar uno] │
└───────────────────────────────┴──────────────────────────────┘
```

Decisiones:

- **Densidad con aire:** Exophase es más denso; CheevoVault puede ser denso pero legible, con 10–12 px de separación y texto de 13–14 px.
- **El arte del último juego** da identidad y evita un header genérico. Cachear la imagen y usar `blurDataURL` o un color dominante.
- **“Cerca del platino”** es una llamada a la acción perfecta: el usuario ve qué le falta y vuelve.
- **“Backlog roulette”** es una función simple que Exophase tiene (“Random Games”) y que en CheevoVault encaja con grupos y backlog.
- **Filtros de estado** con “Platino” y “100 %” separados.
- **Modo público:** el mismo layout sin botones de edición, con CTA de registro.

---

## 8. Diseño propuesto: página de juego PSN

```
┌──────────────────────────────────────────────────────────────┐
│ Hero: key art + cover + título + plataforma + tabs           │
│ Trofeos | Leaderboard | Guía IA | Precios                     │
├──────────────────────────────────────────────────────────────┤
│ 2,3 M ganados · 74 k jugadores · 69 trofeos · 8.511 EXP      │
│ 16.575 platinos · 4.577 100 % · 82 % completitud media       │
├──────────────────────────────────────────────────────────────┤
│ Todas | Ganadas | Bloqueadas     Orden: grado/rareza/fecha    │
│ [icon] Trofeo            Grado  Rareza   EXP   Fecha          │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│ Derecha: Mi progreso (si login) · También en · Info · Capturas│
│ Leaderboard del juego: top Vault Points / completado más rápido│
└──────────────────────────────────────────────────────────────┘
```

Claves:

- **SSR y datos canónicos**: la página existe aunque nadie de CheevoVault haya jugado el juego.
- **Progreso superpuesto** si hay sesión: no crear una URL distinta por usuario; usar el mismo canonical y `?u=` solo para comparar.
- **“Guía IA”**: reutilizar `GameAiExport`; es un diferenciador frente a Exophase y una razón para visitar la página sin cuenta.
- **Leaderboard del juego**: después del snapshot, es trivial y muy competitivo.
- **JSON-LD**: `VideoGame` con `name`, `image`, `gamePlatform`, `developer`, `publisher`, `genre`, `datePublished`; `BreadcrumbList`; `ItemList` de trofeos si se quiere (sin prometer rich results).

---

## 9. Métricas y experimentos

### North star

- **Perfiles públicos vistos por semana** (descubrimiento) y **usuarios que enlazan PSN y verifican** (actividad).
- **Signups atribuidos a superficies públicas** (`/u/*`, `/psn/*`, tarjetas).

### Técnicas

- p95 de carga de perfil PSN < 500 ms desde DB.
- % de perfiles con sync < 6 h > 95 %.
- Tasa de error de sync < 2 %; 429 < 1 %.
- Cobertura de definiciones: > 99 % de NPWR vistos.
- Peso de `/api/psn/titles` < 100 KB por página.

### Producto

- Verificación: % de cuentas PSN verificadas; tiempo hasta verificar.
- Retención: D7/D30 de usuarios con PSN vs sin PSN.
- Engagement: filtros usados, “cerca del platino” clicado, random game, leaderboard del juego.
- Compartir: tarjetas creadas, descargas, backlinks.

### Experimentos

1. **Verificación obligatoria para rankings** vs solo badge: medir caída de participación y reportes.
2. **Perfil público por defecto** vs opt-in: no hacerlo por defecto sin consentimiento; probar el CTA.
3. **Card theme**: 3 estilos; medir creación y shares.
4. **“Cerca del platino”** en el perfil: medir clics y juegos retomados.
5. **Página de juego con “Guía IA”** vs sin: medir tiempo en página y signups.

---

## 10. Riesgos y legal

- **API no oficial de Sony.** `psn-api` usa la API móvil; Sony puede cambiarla. Mantener el manejo de errores y un fallback a “datos de hace X” en vez de página vacía.
- **NPSSO.** Caduca a los 60 días; no automatizar el login (captcha). El cron actual está bien; añadir alerta si el sync empieza a dar 401/403.
- **Una sola cuenta para toda la app.** Respetar el rate limit; no hacer fan-out por usuario en cada visita. El snapshot es la solución.
- **Privacidad.** Los trofeos son públicos en PSN, pero el usuario puede no esperar que CheevoVault los publique. Opt-in claro, poder ocultar juegos/trofeos, borrado real al desenlazar.
- **Suplantación.** Verificación About Me + no indexar por PSN ID si no está verificado.
- **Scraping de Exophase.** No usar sus endpoints/datos en producción; el análisis es competitivo, no una fuente de datos. Sus páginas están protegidas por Cloudflare y sus términos aplican.
- **Contenido generado por usuarios.** Reportes, moderación, límites y logs.
- **Derechos de imagen.** Portadas/avatares de PSN se usan como contenido del propio usuario; cachear con cuidado y no redistribuir como base de datos.

---

## 11. Apéndice: evidencia y detalles

### 11.1 Campos del resumen de jugador (55)

`total_awards`, `earned_points`, `possible_awards`, `master_playerid`, `is_banned`, `lastsync`, `id`, `service_id`, `canonical_id`, `environment_player_id`, `displayname`, `username`, `avatar`, `gamesplayed`, `rank_ww`, `progress_points`, `progress_awards`, `progress_average`, `earned_exp`, `completed_games`, `playtime`, `beaten_games`, `extra`, `total_hidden`, `level_progress`, `status`, `level`, `psplus`, `region`, `rank_country`, `bronze`, `silver`, `gold`, `platinum`, `parent_ids`, `progress`, `lastsyncFormatted`, `rank`, `totals`, `chart`, `playtime_details`, `lastsync_formatted`, `preferences`, `env`, `award_type`, `environment`, `environment_phrase`, `environment_slug`, `environment_id`, `user_id`, `is_editable`, `endpoint`, `expAwardRatio`, `awards`, `awards_rare`.

### 11.2 Campos de un juego (28)

`master_id`, `master_playerid`, `earned_awards`, `earned_points`, `completion_date`, `beaten`, `lastplayed`, `playtime`, `earned_exp`, `earned_bronze`, `earned_silver`, `earned_gold`, `earned_platinum`, `isInvalidated`, `privacy`, `status`, `completion_information`, `percent`, `lastunlock`, `firstplayed`, `completion_date_utc`, `lastplayed_utc`, `total_awards`, `resource_standard`, `resource_small`, `resource_tile`, `playtimeUnits`, `meta`.

### 11.3 Fórmula EXP: validación

Para 69 trofeos de FFXVI:

- Suma de `3300 / rareza` redondeada = **8.511**.
- “Obtainable EXP” de la página = **8.511**.
- Suma de puntos por grado = **1.635**.
- “Points” de la página = **1.635**.

Conclusión: la fórmula se sostiene para PSN. No pudimos confirmar si se aplica igual en Xbox/Steam, pero el patrón y los valores son consistentes.

### 11.4 Verificación: pseudocódigo

```ts
// src/lib/psnClient.ts
export async function psnAboutMe(accountId: string): Promise<string> {
  const auth = await authorization()
  const profile = await psnCall(() => getProfileFromAccountId(auth, accountId))
  return profile.aboutMe ?? ''
}

// src/app/api/psn/verify/route.ts
const auth = await requireSession()
if (!auth.ok) return auth.response

const row = await pool.query(
  'SELECT psnaccountid, psn_verification_code FROM users WHERE id = $1',
  [auth.id],
)
const { psnaccountid, psn_verification_code } = row.rows[0] ?? {}
if (!psnaccountid || !psn_verification_code) {
  return NextResponse.json({ error: 'no-code' }, { status: 409 })
}

const about = await psnAboutMe(psnaccountid)
if (!about.toUpperCase().includes(psn_verification_code.toUpperCase())) {
  return NextResponse.json({ error: 'not-found-in-about-me' }, { status: 422 })
}

await pool.query(
  `UPDATE users
      SET psn_verified_at = NOW(), psn_verification_code = NULL
    WHERE id = $1`,
  [auth.id],
)
return NextResponse.json({ verified: true })
```

Reglas: el código se genera en el servidor, no se reutiliza, caduca a las 24 h y la comprobación tiene rate limit. No se guarda el About Me completo; solo se usa para comparar.

### 11.5 Glosario

- **NPWR**: ID del set de trofeos de Sony (`NPWR20188_00`).
- **CUSA/PPSA**: ID del juego en la Store; un juego puede tener varios sets.
- **Master game**: juego global de Exophase que agrupa versiones.
- **Environment**: plataforma/servicio (`psn`, `steam`, `xbox`).
- **Invalidation**: marcar un juego como no válido para rankings.
- **Gamercard**: imagen PNG generada con stats, para foros/firmas.
- **Vault Points**: puntuación propia de CheevoVault.

---

## 12. Qué haría yo, en una frase

**Convierte PSN en un dataset propio y verificable, y pon encima páginas públicas y tarjetas que la gente quiera compartir; mantén la analítica, la privacidad y la puntuación que ya hacen mejor a CheevoVault.**

El orden exacto:

1. Verificación About Me + rankings solo con verificados.
2. Perfiles públicos opt-in + OG por usuario.
3. Snapshot PSN persistente + sync cada 6 h.
4. Páginas SSR de juego + sitemap + JSON-LD.
5. Paginación server-side + “last synced”/rescan.
6. Stats globales, clubs y leaderboards por juego.
7. Gamercards y SEO localizado.

Ese paquete no copia a Exophase: corrige sus debilidades (payload, accesibilidad, idiomas, privacidad, analítica) y usa su misma ley de producto: **los datos se guardan, las páginas son públicas y el usuario puede demostrar quién es**.
