# Un solo NPSSO y picos de registro: cómo lo gestionan Exophase, YourGamerProfile y PSNProfiles, y qué hacer en CheevoVault

**Fecha:** 23 de octubre de 2026
**Pregunta:** “Solo tenemos un NPSSO. Si un día se registran 10, 100 o 1.000 personas, ¿se cuelga la página?”
**Respuesta corta:** con el código actual, el riesgo es real, pero no por los registros en sí: por **cuántas llamadas a Sony dispara cada perfil nuevo**. Un solo usuario nuevo puede generar cientos de llamadas si abre el panel con la caché fría. Diez a la vez pueden provocar 429; cien pueden degradar la app; mil pueden tumbarla. La solución no es tener 1.000 NPSSO: es **persistir, encolar, sincronizar por fases y poner un presupuesto global**. Con eso, un NPSSO aguanta 1.000 registros/día si el onboarding rápido cuesta ~5 llamadas y la carga profunda se hace en segundo plano. Para sincronización completa de 1.000/día sí hacen falta 3–5 cuentas de servicio o varios días de cola.

---

## 0. Resumen ejecutivo

1. **Un registro no llama a PSN.** La llamada ocurre al enlazar la cuenta y, sobre todo, al abrir el panel: `summary`, `titles`, `recentTrophies` y el heatmap anual se piden en paralelo.
2. **El coste real de un perfil frío es enorme.** Para una cuenta de 500 juegos con 100 recientes: ~3 llamadas de resumen + ~104 de títulos/jugados/sets + ~6 de recientes + ~200 del año ≈ **313 llamadas a Sony**. Para 1.000 juegos y 300 recientes, ~**734**.
3. **El freno global actual solo cubre el scoring, no las lecturas de perfil.** `psn-score` permite 300 juegos/15 min (~600 llamadas), pero `psnSummary`, `psnTitles`, `psnRecentTrophies` y `psnGameTrophies` no pasan por ese freno. Un solo perfil frío puede superar el presupuesto de toda la app.
4. **La caché de 15 minutos es demasiado corta para una librería completa.** Cada 15 minutos, la primera visita de cada cuenta vuelve a pedir títulos, jugados y sets. Diez visitas simultáneas tras la expiración son diez fetches completos.
5. **`withSteamCache` deduplica solo dentro de una instancia.** En Vercel, varias instancias pueden pedir lo mismo a la vez. No hay single-flight en Postgres.
6. **No hay caché negativa ni stale-while-revalidate.** Un perfil privado se reintenta en cada visita; una caché expirada bloquea la página esperando a Sony.
7. **El refresh de tokens no está serializado entre instancias.** Cada instancia tiene su `pending` en memoria; varias pueden intentar refrescar el mismo refresh token a la vez.
8. **Exophase no hace esto en vivo.** Persiste perfiles, escanea en segundo plano (el siguiente escaneo puede tardar 4–6 h), permite escaneo manual y sirve las páginas desde su base de datos. A su escala (3,26 M jugadores), un solo NPSSO es matemáticamente imposible: usan un pool de cuentas y/o acceso de partner; el diseño exacto no es observable.
9. **YourGamerProfile (yourgamerprofile.com) tampoco hace sync en vivo.** Tiene un botón “Sync”, un **cooldown de 2 h gratis / 1 h Premium / 30 min Premium Plus**, sync diario programado para Premium, trabajos en segundo plano y notificaciones. Es el modelo de “demanda controlada + cola”.
10. **PSNProfiles y TrueTrophies aplican cuotas parecidas:** PSNProfiles actualiza Premium cada 6 h, registrados cada día, no registrados cada semana, y manual una vez por hora; TrueTrophies hace scan automático diario y 3 manuales/24 h. Nadie sincroniza en cada visita.
11. **La arquitectura correcta para CheevoVault:** el request del usuario nunca llama a Sony; todo va a una cola en Postgres; un worker con presupuesto global y prioridades sincroniza por fases (resumen → títulos → recientes → historial → score); las páginas leen snapshots; si hay 429, se sirve stale y se abre un circuit breaker.
12. **Un NPSSO es suficiente para 10 y 100 registros/día, y para 1.000/día con onboarding rápido + cola.** No es suficiente para sincronización completa de 1.000/día; el número de cuentas necesarias depende de la profundidad y de la frecuencia, no del número de registros.

---

## 1. El problema real: no son los registros, es el fan-out

### 1.1 Qué pasa hoy cuando alguien enlaza PSN

`POST /api/psn/link`:

1. `findPsnAccount` → 1 llamada de búsqueda.
2. `psnSummary` → 3 llamadas (`getUserTrophyProfileSummary`, `getUserTitles` con `limit=1`, `getProfileFromAccountId`).
3. Guarda `psnaccountid`/`psnusername`.
4. `onPlatformLinked` → `startFill`, que después de responder ejecuta un pase de scoring con `psnTitles` y lecturas por juego.

Ese mismo usuario abre el panel y se disparan, como mínimo:

- `PsnGamesDataProvider` → `GET /api/psn/titles`.
- `usePsnSummary` → `GET /api/psn/summary` (normalmente ya cacheado por el link).
- `ActivityHeatmapYearProvider` → `GET /api/psn/recentTrophies?scope=year`.
- `MainPageProfilePsnLinked` → `GET /api/psn/recentTrophies?scope=recent`.
- Si abre un juego → `GET /api/psn/trophies` y `GET /api/psn/details`.
- El heartbeat de presencia puede lanzar `refreshScoreIfStale` (hasta 25 s de lecturas PSN).

No es una llamada: son **cuatro rutas PSN en paralelo**, cada una con su propia caché y su propio fan-out.

### 1.2 Cuántas llamadas a Sony cuesta cada ruta

| Función | Llamadas a Sony | Notas |
|---|---:|---|
| `psnSummary` | 3 | Resumen + títulos `limit=1` + perfil |
| `psnTitles` (frío) | `ceil(T/800)` + `ceil(P/200)` + `ceil(P/5)` | T = títulos, P = jugados; el tercer término es el mapeo `CUSA→NPWR` por lotes de 5 |
| `psnLatestTrophies` | 6 | 3 juegos × 2 llamadas |
| `psnRecentTrophies('year')` | 2 × juegos con último trofeo en el año | Cada juego: definiciones + ganados |
| `psnGameTrophies` | 2 | Definiciones + ganados |
| `psnGameGroups` | 2 | Grupos + progreso por grupo |
| Score (`psnPlan`) | 2 por juego | Hasta 100 juegos/pase y 300 juegos/15 min en total |

Para una cuenta de **500 juegos, 300 jugados, 100 con trofeo en el año**:

- Resumen: 3
- Títulos: 1 + 2 + 60 = 63
- Recientes: 6
- Año: 200
- **Total: ~272 llamadas** (más IGDB para PS3/Vita).

Para **1.000 juegos, 600 jugados, 300 recientes**:

- Resumen: 3
- Títulos: 2 + 3 + 120 = 125
- Recientes: 6
- Año: 600
- **Total: ~734 llamadas**.

Eso es **un solo usuario**. Multiplica:

| Usuarios fríos simultáneos | Llamadas estimadas (500 juegos) |
|---:|---:|
| 1 | ~272 |
| 10 | ~2.720 |
| 100 | ~27.200 |
| 1.000 | ~272.000 |

A 40 llamadas/minuto (el presupuesto conservador que ya usa `psn-score`), 10 usuarios fríos son ~68 minutos de presupuesto; 100 son ~11 horas; 1.000 son ~113 horas. No es que la página “se cuelgue” por CPU: se queda esperando a Sony, recibe 429 y, como no hay una cola, cada reintento vuelve a golpear.

### 1.3 Los multiplicadores que empeoran el pico

1. **Caché de 15 minutos.** `psnSummary` y `psnTitles` viven 15 min. En una campaña de registro, todos llegan a la vez, pero las cachés expiran a la vez. La primera visita después de expirar vuelve a pagar el coste completo.
2. **Sin single-flight entre instancias.** `withSteamCache` tiene un `inFlight` en memoria; dos instancias de Vercel no lo comparten. Si 10 requests de la misma cuenta caen en 10 instancias, hay 10 fetches.
3. **Sin presupuesto global para lecturas.** `allowAttempt('psn-score','app')` frena el scoring, no el resto. `psnTitles`, `psnSummary`, `psnRecentTrophies` y `psnGameTrophies` no consultan ese presupuesto.
4. **Sin caché negativa.** Un perfil privado lanza la excepción y no se cachea; cada visita vuelve a pedir. Lo mismo con un online ID inexistente.
5. **Sin stale-while-revalidate.** Cuando la caché expira, la request espera a Sony. Si Sony tarda 10 s o falla, la página entera espera o se rompe.
6. **Reintento de 2 s en 429.** `psnCall` reintenta una vez; si 100 usuarios reciben 429, el reintento duplica la presión en el peor momento.
7. **Refresh de tokens no serializado.** Varias instancias pueden intentar refrescar a la vez; una puede invalidar el refresh token de otra.
8. **El heatmap anual es el peor enemigo.** `psnRecentTrophies('year')` recorre todos los juegos con último trofeo en 365 días y pide 2 llamadas por juego. En un perfil nuevo, es el 70–80 % del coste.
9. **El scoring duplica lecturas.** `scoreRefresh` vuelve a pedir `psnTitles` y trofeos por juego que el perfil ya pidió. Sin snapshots, se paga dos veces.
10. **Vercel y timeouts.** Una ruta que hace 100+ llamadas secuenciales puede agotar el tiempo de la función; si no llega a escribir la caché, la siguiente request empieza de cero.
11. **`after()` no es una cola.** `onPlatformLinked` y el heartbeat usan `after()` para lanzar el scoring después de responder, pero sigue consumiendo tiempo de la misma función y no garantiza que termine. Bajo carga, esos trabajos compiten con las requests y se cortan. Una cola real (Postgres + worker) es más fiable.

---

## 2. Qué puede hacer realmente un NPSSO

No hay un límite público y estable de Sony. Lo que sí sabemos:

- CheevoVault ya midió que PSN tolera **4 lecturas a la vez** y usa **2 concurrentes** para scoring.
- El presupuesto actual de `psn-score` es **300 juegos/15 min = 600 llamadas/15 min = 40 llamadas/minuto**.
- Ese 40/min es un **techo conservador de la app**, no una garantía de Sony. Puede ser más alto o más bajo según el día, la ruta y la cuenta.

Con 40 llamadas/minuto:

| Trabajo | Llamadas | Tiempo con 1 NPSSO |
|---|---:|---:|
| Onboarding rápido (resumen + títulos, sin jugados/sets) | ~4 | 6 s |
| Enriquecimiento de 20 juegos recientes | ~45 | ~1 min |
| Sync completo de 500 juegos | ~313 | ~8 min |
| Sync completo de 1.000 juegos | ~734 | ~18 min |
| 100 syncs completos | ~31.300 | ~13 h |
| 1.000 syncs completos | ~313.000 | ~130 h |

La conclusión importante: **un NPSSO no está limitado por el número de registros, sino por el número de llamadas que decides hacer por registro y por la prisa**. Si el onboarding rápido son 4 llamadas, 1.000 registros son 4.000 llamadas (~100 min). Si el onboarding es un sync completo de 313 llamadas, 1.000 registros son 313.000 llamadas (~5,4 días).

También es un **punto único de fallo**: si el NPSSO caduca, todo PSN deja de funcionar. El cron avisa 7 días antes, pero no hay failover. Un segundo NPSSO de reserva (de una cuenta que controles) es sensato incluso si no se usa para carga.

---

## 3. Cómo lo gestiona Exophase

### 3.1 Lo observable

- **Persisten los datos.** El perfil de Hakoom que analizamos tenía `last sync: 14 dic 2024` y seguía sirviendo su histórico. La página no consulta PSN al abrirse.
- **Escaneos en segundo plano.** Su guía de privacidad dice: “wait until the next profile scan (can take up to 4-6 hours) OR … initiate a manual rescan”.
- **Escaneo manual con profundidad.** `POST /account/sync/manual` con `scanDepth=3`; aviso de que corre en segundo plano y puede tardar minutos.
- **Estado visible.** `lastsync`, `lastsyncFormatted`, `total_hidden`, `is_banned`.
- **Páginas públicas.** Perfiles y páginas de juego se sirven desde su base de datos; no hay una llamada a Sony por visitante.
- **Escala.** 3,26 M jugadores, 758 M partidas, 6,3 B trofeos. A esa escala, un único NPSSO es imposible: harían falta millones de llamadas al día. Usan un **pool de cuentas de servicio y/o acceso de partner**; el diseño exacto no es público.

### 3.2 Lo que se puede copiar

1. **Persistencia primero.** El dato vive en su base de datos; la visita solo lo lee.
2. **Cola de escaneos.** No se sincroniza en la request; se encola y se procesa en segundo plano.
3. **Prioridad y profundidad.** No todos los escaneos recorren todo; `scanDepth` y `lastsync` sugieren niveles.
4. **Estado de frescura.** El usuario ve cuándo se actualizó por última vez.
5. **Páginas públicas desde DB.** El SEO y la velocidad salen gratis una vez persistido.

### 3.3 Lo que no conviene copiar

- **Perfiles obsoletos durante meses sin aviso proactivo.** Hay que mostrar “desactualizado” y ofrecer rescan, no dejar que el usuario lo descubra.
- **Un solo pool sin límites visibles.** No se puede copiar su escala sin su infraestructura.
- **HTML con cientos de KB de JSON duplicado.** Mejor paginación y DTOs ligeros.

---

## 4. Cómo lo gestiona YourGamerProfile (yourgamerprofile.com)

YourGamerProfile es un caso muy útil porque es más pequeño y su producto enseña la mecánica en la UI y en los términos.

### 4.1 Lo observable

- **Sync manual con cooldown.** Los términos dicen: “Faster gaming data sync cooldown (1 hour on Premium and 30 minutes on Premium Plus, vs. 2 hours for free accounts)”.
- **Sync diario programado.** En la configuración: “Run a full sync automatically every day at the time you pick” (Premium).
- **Trabajo en segundo plano.** “Sync started! You'll be notified when it's done”, “Syncing {completed}/{total}”, “Sync in progress”.
- **Estados de cola.** “Never synced”, “On cooldown”, “min remaining”, “Ready to sync”.
- **Admin puede resetear el cooldown y lanzar syncs** (“User Sync: manage sync cooldown and trigger game syncs for users”).
- **Verificación pendiente.** “Your {platform} account still needs confirming”; hasta verificarlo, los trofeos no aparecen.
- **Errores por plataforma.** `psn_private_or_unavailable`, `psn_temporarily_unavailable`, `psn_account_not_found`.
- **Primer sync lento avisado.** “The first sync may take a few minutes depending on the size of your library”.
- **Next.js + tRPC + Cloudflare + image proxy.** Su perfil público es SSR/RSC y sus páginas de juego/usuarios están en sitemaps; el sync no se hace en la visita.

### 4.2 Por qué esto funciona

- **El coste está acotado por usuario y por tiempo.** Un usuario gratis no puede pedir más de un sync cada 2 h; Premium cada 1 h; Premium Plus cada 30 min. Eso convierte una demanda impredecible en una demanda máxima conocida.
- **El sync es una cola, no una promesa síncrona.** La UI dice “started” y notifica al terminar; no bloquea la página.
- **La verificación separa identidad de datos.** No se muestran trofeos de una cuenta no confirmada.
- **Se monetiza la velocidad**, no el acceso básico. Es una decisión de producto que también es una válvula de seguridad.

### 4.3 Lo que se puede copiar

1. **Cooldown visible y por plan.** Aunque CheevoVault no cobre, un cooldown de 10–15 min para el botón manual y 6 h para el automático es razonable.
2. **“Last synced” + “Next sync” + “Syncing”.** El usuario deja de pulsar refresh.
3. **Cola con notificación.** “Tu biblioteca se está actualizando; te avisamos cuando termine”.
4. **Verificación antes de mostrar.** Sobre todo para rankings.
5. **Errores accionables por plataforma.** “Perfil privado”, “cuenta no encontrada”, “PSN no disponible”.
6. **Un sync diario programado** para usuarios activos, en lugar de refrescar cada 15 min.

---

## 5. Cómo lo gestionan PSNProfiles y TrueTrophies

No son el mismo producto, pero confirman el patrón de la industria:

- **PSNProfiles:** Premium se actualiza cada 6 h; registrados cada día; no registrados cada semana; actualización manual una vez por hora.
- **TrueTrophies:** scan automático una vez al día; 3 scans manuales cada 24 h.

Es decir: **cuotas + lotes + perfiles persistidos**, nunca sincronización en vivo por visita. La diferencia entre sitios es el tamaño del lote y la prioridad, no el modelo.

---

## 6. El patrón común

Todos los sitios que aguantan escala hacen lo mismo:

```
Usuario                CheevoVault                     Sony
  │                        │                            │
  │  abre perfil           │                            │
  │───────────────────────>│  lee snapshot de Postgres  │
  │<───────────────────────│  (sin llamar a Sony)       │
  │                        │                            │
  │  pide refresh / link   │  encola job                │
  │───────────────────────>│───────────────────────────>│  worker con
  │<── “en cola”           │  presupuesto global        │  concurrencia
  │                        │  y prioridades             │  limitada
  │                        │                            │
  │  vuelve más tarde      │  lee snapshot actualizado  │
  │───────────────────────>│                            │
```

Componentes:

1. **Snapshot persistente** (jugador, juegos, trofeos).
2. **Cola de trabajos** con prioridad, reintentos y backoff.
3. **Presupuesto global** de llamadas (token bucket) y **cuota por usuario**.
4. **Single-flight** por cuenta (una sola sincronización a la vez).
5. **Fases**: core rápido → recientes → historial → score.
6. **Stale-while-revalidate**: servir lo viejo mientras se actualiza.
7. **Caché negativa** y **circuit breaker** para 429/privados.
8. **Observabilidad**: llamadas/min, 429, cola, latencia, frescura.

---

## 7. Arquitectura recomendada para CheevoVault

### 7.1 Principio número uno: la request del usuario no llama a Sony

Excepciones permitidas:

- Validar un online ID al enlazar (1 llamada) o incluso eso en cola.
- Un botón “actualizar ahora” que **encola** y devuelve 202.
- Nada más.

Todo lo demás se lee de Postgres. Si no hay snapshot, se muestra “sincronizando” y se encola; no se bloquea la página.

### 7.2 Cola en Postgres (sin infraestructura nueva)

```sql
CREATE TABLE psn_sync_jobs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase        TEXT NOT NULL,              -- 'summary' | 'titles' | 'recent' | 'history' | 'score'
  priority     SMALLINT NOT NULL DEFAULT 5, -- 0 link, 1 manual, 2 activo, 3 cron, 4 historial, 5 score
  run_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | error
  attempts     SMALLINT NOT NULL DEFAULT 0,
  locked_by    TEXT,
  locked_until TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un solo job activo por usuario y fase.
CREATE UNIQUE INDEX psn_sync_jobs_one_active
  ON psn_sync_jobs (user_id, phase)
  WHERE status IN ('queued', 'running');

CREATE INDEX psn_sync_jobs_ready
  ON psn_sync_jobs (status, priority, run_after);
```

El worker toma un job con `FOR UPDATE SKIP LOCKED`:

```sql
UPDATE psn_sync_jobs
SET status = 'running',
    locked_by = $1,
    locked_until = NOW() + INTERVAL '2 minutes',
    updated_at = NOW()
WHERE id = (
  SELECT id
  FROM psn_sync_jobs
  WHERE status = 'queued' AND run_after <= NOW()
  ORDER BY priority, run_after
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;
```

Se ejecuta desde un cron cada minuto (`/api/cron/psn-worker`) o desde un proceso aparte. Vercel Cron es suficiente para empezar; si el volumen crece, un worker dedicado. Antes de tomar jobs, recupera los que quedaron `running` con `locked_until < NOW()` (worker muerto o timeout) y vuelve a ponerlos en `queued` con un `attempts + 1`.

```sql
UPDATE psn_sync_jobs
SET status = 'queued', locked_by = NULL, locked_until = NULL, updated_at = NOW()
WHERE status = 'running' AND locked_until < NOW();
```

### 7.3 Presupuesto global y prioridades

Un solo NPSSO = un solo presupuesto. Empieza con **600 llamadas/15 min** (el número que ya usa `psn-score`) y súbelo solo con datos.

```sql
CREATE TABLE psn_budget (
  id         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tokens     REAL NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reponer (el descuento va en la misma transacción, ver el código de abajo).
UPDATE psn_budget
SET tokens = LEAST(600, tokens + (40.0 / 60) * EXTRACT(EPOCH FROM (NOW() - updated_at))),
    updated_at = NOW()
WHERE id = 1
RETURNING tokens;
```

Cada **llamada** a Sony consume un token, no cada job: un job de historial puede necesitar 40 llamadas y debe ir gastando el presupuesto poco a poco. Si no hay token, el job se reprograma con jitter (no se reintenta en caliente). Prioridades:

| Prioridad | Trabajo | Por qué |
|---:|---|---|
| 0 | Verificación/link | El usuario está esperando |
| 1 | Refresh manual | El usuario lo pidió |
| 2 | Primer sync de usuario activo | Onboarding |
| 3 | Cron de usuarios activos | Frescura |
| 4 | Historial/backfill | Puede esperar |
| 5 | Score | Se puede calcular del snapshot |

### 7.4 Single-flight por cuenta y refresh de token

**Single-flight de datos:**

```ts
const client = await pool.connect()
try {
  const { rows } = await client.query(
    'SELECT pg_try_advisory_lock(hashtext($1)) AS ok',
    [`psn:${accountId}`],
  )
  if (!rows[0].ok) {
    // Otra instancia está sincronizando: sirve stale o 202.
    return readStaleOr202()
  }
  try {
    return await doSync()
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [`psn:${accountId}`])
  }
} finally {
  client.release()
}
```

**Refresh de token:** `psn_credentials` es una sola fila; usa `SELECT ... FOR UPDATE` dentro de una transacción. La primera instancia refresca; las demás esperan y leen el token nuevo. Sin esto, varias instancias pueden gastar el refresh token a la vez.

```ts
await client.query('BEGIN')
const row = await client.query('SELECT * FROM psn_credentials WHERE id = 1 FOR UPDATE')
// Si access_expires_at sigue vigente, usa ese token.
// Si no, refresca una vez y guarda.
await client.query('COMMIT')
```

### 7.5 Fases de sincronización

No hagas un sync completo al enlazar. Haz esto:

| Fase | Qué hace | Llamadas | Cuándo |
|---|---|---:|---|
| `summary` | Perfil + resumen | 3 | Al enlazar |
| `titles` | Solo `getUserTitles` (sin jugados/sets) | 1–2 por 800 | Inmediato |
| `recent` | 10–20 juegos recientes: trofeos + playtime | ~45 | 1–5 min después |
| `history` | Juegos con último trofeo en 365 días | 2/juego | Background, por lotes |
| `score` | Vault Points desde el snapshot | 0 (DB) | Después de `history` |

La clave: **`psnTitlesCore` no debe llamar a `getUserPlayedGames` ni a `trophySetsOf`**. Esos son enriquecimiento, no identidad. Con `getUserTitles` ya tienes título, plataforma, progreso, contadores, icono y `lastUpdated`.

```ts
// core: 1-2 llamadas, perfil visible en segundos
export async function psnTitlesCore(accountId: string) {
  const auth = await authorization()
  const titles: TrophyTitle[] = []
  for (let offset = 0; ; offset += 800) {
    const page = await psnCall(() => getUserTitles(auth, accountId, { limit: 800, offset }))
    titles.push(...(page.trophyTitles ?? []))
    if (!page.nextOffset) break
  }
  return titles.map(toPsnGameProgress)
}

// enrichment: en background, solo los recientes
export async function psnTitlesEnriched(accountId: string, recentOnly = 20) {
  // getUserPlayedGames + trophySetsOf + withPlayData + IGDB
}
```

### 7.6 Separar definiciones de progreso

Hoy `psnGameTrophies` cachea definiciones y ganados juntos con la clave:

```
psn:trophies:v2:${accountId}:${titleId}:${lastTrophyAt}:${language}
```

Eso significa que **cada usuario vuelve a pedir las definiciones del mismo juego**. Sepáralas:

```
psn:defs:${titleId}:${language}                 // global, 90 días
psn:earned:${accountId}:${titleId}:${lastTrophyAt} // por usuario, 30 días
```

Lo mismo para grupos:

```
psn:groups-defs:${titleId}:${language}
psn:groups-earned:${accountId}:${titleId}
```

Esto reduce a la mitad las llamadas de las páginas de juego y hace que la definición se pague una vez para todos los usuarios.

### 7.7 Stale-while-revalidate y caché negativa

- **Stale:** si `steam_cache.expires_at` pasó pero el dato tiene menos de X días, devuélvelo y encola un refresh. La página nunca espera a Sony.
- **Negativa:** `psn:private:${accountId}` (10 min) y `psn:notfound:${onlineId}` (1 h). Un perfil privado no debe golpear a Sony en cada visita.
- **Circuito:** si los 429/5xx superan un umbral en 60 s, abre el circuito 2 min y sirve stale. No reintentes en caliente.
- **Jitter:** los reintentos y los `run_after` deben llevar jitter para que 100 jobs no salgan a la vez.

### 7.8 Cuotas de producto

Aunque no cobres, pon límites visibles:

- **Manual:** 1 vez cada 10–15 min por usuario.
- **Automático:** cada 6 h para activos; daily para el resto.
- **Al enlazar:** un solo sync core; el resto en cola.
- **UI:** “Actualizado hace 12 min · Próxima actualización en 5 h 48 min · Actualizar ahora”.

Esto reduce la demanda más que cualquier optimización de código.

### 7.9 Score desde el snapshot, no desde Sony

Hoy `scoreRefresh` vuelve a pedir `psnTitles` y trofeos por juego. Si persistes `psn_player_trophies`, `scoreGame` puede calcular Vault Points desde Postgres:

- Sin llamadas a Sony.
- Sin competir con el onboarding.
- Sin duplicar lecturas.
- Recalculable cuando cambien las reglas.

Es el mayor ahorro después del onboarding rápido.

### 7.10 Múltiples cuentas: al final, no al principio

Si tras medir sigues necesitando más capacidad:

```
psn_service_accounts (
  id, label, npsso_encrypted, status, last_used_at,
  calls_window, cooldown_until, created_at
)
```

- Router por least-loaded/round-robin.
- Presupuesto por cuenta, no global.
- Health check y cuarentena en 429/401.
- Una cuenta de **reserva** para failover, aunque no se use para carga.
- Solo cuentas que controles; nada de cuentas falsas. Sony puede banear; revisa términos y ten un plan B.

Pero no empieces por aquí: si la request sigue llamando a Sony, 5 cuentas solo compran tiempo. Primero persistencia + cola + fases.

---

## 8. Plan de capacidad: 10, 100, 1.000 y 10.000 registros/día

Supuestos:

- 50 % de los registros enlazan PSN.
- Biblioteca media: 500 juegos; 100 con trofeo en el año.
- **Onboarding rápido:** 4 llamadas (resumen 3 + títulos 1).
- **Enriquecimiento:** 45 llamadas (20 juegos recientes).
- **Sync completo:** 313 llamadas (títulos + jugados + sets + recientes + año).
- **Presupuesto:** 40 llamadas/min (conservador; mide el real).

| Registros/día | Enlaces PSN | Onboarding rápido | Enriquecimiento | Sync completo | Veredicto con 1 NPSSO |
|---:|---:|---:|---:|---:|---|
| 10 | 5 | 20 llamadas (30 s) | 225 (6 min) | 1.565 (39 min) | Sobra |
| 100 | 50 | 200 (5 min) | 2.250 (56 min) | 15.650 (6,5 h) | Bien con cola; los picos hay que suavizarlos |
| 1.000 | 500 | 2.000 (50 min) | 22.500 (9,4 h) | 156.500 (65 h) | Onboarding + enriquecimiento sí; sync completo no (3 cuentas o 3 días de cola) |
| 10.000 | 5.000 | 20.000 (8,3 h) | 225.000 (94 h) | 1.565.000 (650 h) | Necesitas 4+ cuentas incluso para enriquecer; sync completo no es viable |

Lectura:

- **10/día:** no es un problema si no haces sync completo en la request. Con el código actual, 10 usuarios fríos a la vez ya pueden dar 429; con cola, sobra.
- **100/día:** un NPSSO aguanta si el onboarding es rápido y el enriquecimiento se reparte. El sync completo de 50 cuentas son ~6,5 h; si llegan todas a la vez, la cola tarda, pero la web no se cae.
- **1.000/día:** un NPSSO aguanta el **onboarding rápido** (50 min) y el enriquecimiento (9,4 h), pero no el sync completo (65 h). Aquí decides: 3 cuentas, o aceptar que el historial completo tarde 2–3 días, o reducir la profundidad (solo 20 recientes + historial bajo demanda).
- **10.000/día:** necesitas pool de cuentas y, probablemente, acceso de partner o una estrategia de “solo últimos juegos”. No es un escenario de un NPSSO.

**Cuándo añadir una cuenta:**

- La cola p95 supera 30 min de forma sostenida.
- 429 > 1 % durante 15 min.
- El onboarding de nuevos usuarios espera más de 5 min.
- El sync completo de la mediana tarda más de 24 h.

Añade una **segunda cuenta de reserva** antes de necesitarla para carga; luego 3–5 según la tabla.

---

## 9. Plan de implementación

### Semana 1: parar el sangrado (sin migraciones grandes)

1. **Presupuesto global para todas las llamadas PSN.** Añade `psn-call` a `attemptLimit` (o un token bucket) y úsalo en `psnSummary`, `psnTitles`, `psnRecentTrophies`, `psnGameTrophies`, `psnGameGroups`. No solo en `psn-score`.
2. **Caché negativa** para privados/no encontrados.
3. **Stale-while-revalidate** en `psnSummary`/`psnTitles`: si hay dato viejo, sírvelo y refresca en background.
4. **Single-flight** por cuenta con advisory lock.
5. **Quitar `getUserPlayedGames`/`trophySetsOf` del primer `psnTitles`.** Crea `psnTitlesCore` y deja el enriquecimiento para después.
6. **No cargar el heatmap anual en el primer render.** Usa `recent` (3 juegos) y muestra “calculando historial” hasta que el backfill termine.
7. **Cooldown manual 10–15 min** y “last synced / next sync” en la UI.
8. **Lock de refresh de token** en `psn_credentials`.

Con esto, el coste de un perfil nuevo baja de ~300 a ~5 llamadas y los picos dejan de ser peligrosos.

### Semanas 2–4: snapshots y cola

1. Migraciones `psn_player_games`, `psn_player_trophies`, `psn_sync_jobs`.
2. Worker `/api/cron/psn-worker` cada minuto; fases `summary`/`titles`/`recent`/`history`.
3. Servir perfil/librería desde el snapshot; `psnTitles` deja de ser la fuente de la página.
4. Backfill de historial por lotes; prioridad baja.
5. Score desde `psn_player_trophies`, sin Sony.
6. Split de caché `psn:defs` / `psn:earned`.

### Semanas 5–8: resistencia y producto

1. Pool de 2–3 cuentas si las métricas lo piden; router y health.
2. Sync diario programado / premium si aplica.
3. Test de carga con 10/100/1.000 usuarios simulados.
4. Chaos: NPSSO caducado, 429 durante 5 min, DB lenta; la web debe servir stale.
5. Alertas y runbook.

---

## 10. Código: piezas clave

### 10.1 Tomar presupuesto antes de cada llamada

```ts
// src/lib/psnBudget.ts
import pool from '@/lib/db'

/** 40 llamadas/minuto; súbelo solo con medidas. */
const RATE_PER_SEC = 40 / 60
const CAPACITY = 40

export async function takePsnCall(): Promise<boolean> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'SELECT tokens, updated_at FROM psn_budget WHERE id = 1 FOR UPDATE',
    )
    const elapsed = (Date.now() - rows[0].updated_at.getTime()) / 1000
    const tokens = Math.min(CAPACITY, rows[0].tokens + RATE_PER_SEC * elapsed)
    if (tokens < 1) {
      await client.query('ROLLBACK')
      return false
    }
    await client.query(
      'UPDATE psn_budget SET tokens = $1, updated_at = NOW() WHERE id = 1',
      [tokens - 1],
    )
    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
```

La fila única serializa las comprobaciones; a 40/min sobra. Si algún día hace falta más, usa una función SQL atómica o varios buckets. Para empezar, `allowAttempt('psn-call','app')` con 600/15 min también sirve y no necesita tabla nueva.

El cliente debe envolver **cada** llamada a Sony, no solo el inicio del job:

```ts
export async function psnCallBudgeted<T>(fn: () => Promise<T>): Promise<T> {
  if (!(await takePsnCall())) throw new PsnBusyError()
  return psnCall(fn)
}
```

Así un job que hace 40 llamadas consume 40 tokens y se detiene cuando el presupuesto se agota. La alternativa es que cada job reserve su coste estimado; es más rígida y deja tokens sin usar.

### 10.2 Worker

```ts
// src/app/api/cron/psn-worker/route.ts
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse('Unauthorized', { status: 401 })
  const deadline = Date.now() + 50_000

  while (Date.now() < deadline) {
    const job = await claimJob() // FOR UPDATE SKIP LOCKED
    if (!job) break
    try {
      // runPhase usa psnCallBudgeted en cada llamada; si no hay tokens,
      // lanza PsnBusy y el job se reprograma sin gastar más.
      await runPhase(job)
      await finishJob(job.id)
    } catch (err) {
      if (err instanceof PsnBusy) await releaseJob(job.id, { runAfter: '30 seconds' })
      else await failJob(job.id, err)
    }
  }
  return NextResponse.json({ ok: true })
}
```

### 10.3 Phase runner

```ts
async function runPhase(job: Job) {
  switch (job.phase) {
    case 'summary':
      return syncSummary(job.user_id)
    case 'titles':
      return syncTitlesCore(job.user_id)
    case 'recent':
      return syncRecent(job.user_id, 20)
    case 'history':
      return syncHistory(job.user_id, 20) // 20 juegos por job
    case 'score':
      return rescoreFromSnapshot(job.user_id)
  }
}
```

### 10.4 Stale cache

```ts
export async function readStale<T>(key: string, staleMs: number): Promise<T | null> {
  const { rows } = await pool.query(
    `SELECT cache_data FROM steam_cache
      WHERE cache_key = $1
        AND created_at > NOW() - ($2 || ' milliseconds')::interval`,
    [key, String(staleMs)],
  )
  return rows[0]?.cache_data ?? null
}
```

Si `readStale` devuelve algo, responde con eso y encola `refresh`. Si no, 202 + “sincronizando”.

### 10.5 Fast titles

```ts
export async function psnTitlesCore(accountId: string, userId: string | null) {
  return withSteamCache(`psn:titles:core:v1:${accountId}`, 15 * 60_000, async () => {
    const auth = await authorization()
    const games: PsnGameProgress[] = []
    for (let offset = 0; ; offset += 800) {
      const page = await psnCall(() => getUserTitles(auth, accountId, { limit: 800, offset }))
      for (const t of page.trophyTitles ?? []) {
        const g = toPsnGameProgress(t)
        if (g) games.push(g)
      }
      if (!page.nextOffset) break
    }
    return games
  }, { userId, refreshable: true })
}
```

### 10.6 UI states

- `syncing` → “Estamos leyendo tu biblioteca. Puedes seguir usando la app.”
- `partial` → “Vemos 320 juegos; el historial completo se está calculando.”
- `stale` → “Actualizado hace 8 h. Actualizar ahora.”
- `error: private` → “Tu perfil de PSN es privado. Cámbialo en Ajustes → Privacidad → Historial de juego.”
- `error: rate-limited` → “PSN está limitando las peticiones. Reintentaremos automáticamente.”

---

## 11. Métricas y alertas

### Métricas

- `psn_calls_total{fn}` — llamadas por función.
- `psn_429_total` — tasa de 429.
- `psn_queue_depth{phase}` y `psn_queue_lag_seconds`.
- `psn_sync_success_total{phase}` / `psn_sync_failure_total{reason}`.
- `psn_cache_hit_ratio{key}`.
- `psn_profile_p95_ms`.
- `psn_token_days_left`.
- `psn_calls_per_user_p95`.

### Alertas

- 429 > 1 % durante 5 min.
- Cola p95 > 15 min.
- Fallos de sync > 5 % durante 15 min.
- Token < 7 días.
- p95 de perfil > 1 s (señal de que se está yendo a Sony).
- Un usuario con más de X llamadas/minuto (bucle o abuso).

### Runbook

1. **429:** abrir circuit breaker, servir stale, bajar `RATE_PER_SEC`, revisar si un job está en bucle.
2. **Token caducado:** renovar en admin; mientras, PSN en modo “solo datos guardados”.
3. **Cola atascada:** mirar jobs `running` con `locked_until` vencido; liberar; revisar worker.
4. **Pico de registros:** priorizar `summary`/`titles`; pausar `history` y `score`; avisar en la UI de que el historial tarda.
5. **Incidente grave:** `PSN_MODE=stale` (feature flag): no se hace ninguna llamada a Sony; se sirven snapshots y se encola para cuando se recupere. Es el botón de “no quemar la cuenta”.

---

## 12. Riesgos y legal

- **Un NPSSO es un punto único de fallo.** Ten una cuenta de reserva y un runbook.
- **Sony no documenta los límites.** Mide y sé conservador; 40/min es un techo de la app, no una verdad de Sony.
- **Múltiples cuentas pueden violar términos.** Usa cuentas que controles; no automatices el login; valora acceso oficial/partner; revisa la ley aplicable.
- **Datos públicos, pero personales.** Los trofeos son públicos en PSN, pero el usuario debe poder ocultarlos o borrarlos en CheevoVault; al desenlazar, borra snapshots y scores.
- **No uses Exophase/YourGamerProfile como fuente de datos.** Este análisis es competitivo; sus APIs y datos tienen sus términos.
- **No prometas tiempo real.** Si el sync es cada 6 h, dilo. La confianza se pierde cuando la UI promete “ahora” y tarda 20 min.

---

## 13. Conclusión

**Tu miedo está justificado con el código actual, pero el problema tiene arreglo sin multiplicar NPSSO.**

- Con **10 registros/día**, el riesgo no es el volumen: es que un solo perfil frío dispare cientos de llamadas y varios a la vez. La cola + onboarding rápido lo resuelve.
- Con **100/día**, un NPSSO sobra si nunca sincronizas en la request y el enriquecimiento va en background.
- Con **1.000/día**, un NPSSO aguanta el onboarding rápido y el enriquecimiento; el sync completo necesita 3–5 cuentas o aceptar varios días de cola.
- Con **10.000/día**, necesitas pool y una estrategia de profundidad; no es un problema de “un NPSSO más”.

La regla de oro: **la visita nunca espera a Sony; el trabajo pesado se encola; el usuario ve el estado; el presupuesto es global; el score se calcula del snapshot.**

Si haces solo una cosa esta semana: **quita `getUserPlayedGames`/`trophySetsOf` del primer `psnTitles` y pone un presupuesto global a todas las llamadas PSN.** Eso solo baja el coste de un perfil nuevo de ~300 a ~5 llamadas y te da margen para construir la cola sin miedo.

**Siguiente nivel:** cuando haya cola y snapshots, el pool de varias cuentas y la UX de sincronización están en **`docs/psn-multi-account-pool.md`**.
