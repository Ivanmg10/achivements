# Pool de NPSSO y experiencia de sincronización PSN

**Fecha:** 23 de octubre de 2026
**Contexto:** CheevoVault tiene hoy un solo NPSSO. El usuario tiene varias cuentas de PSN que puede usar como cuentas de servicio. El objetivo es **más capacidad, menos errores, una experiencia que no se sienta técnica** y que la app no dependa de que Sony responda en el momento.
**Documento hermano:** `docs/psn-scaling-and-rate-limits.md` (capacidad, colas y límites). Este documento se centra en el **pool de cuentas**, la **optimización** y la **UX**.

---

## 0. Resumen ejecutivo

1. **Un pool de NPSSO multiplica la capacidad, pero no arregla una arquitectura que llama a Sony en cada visita.** Primero se persiste y se encola; después se añaden cuentas.
2. **Varias cuentas no necesitan afinidad por usuario.** Cualquier cuenta de PSN puede leer un perfil público; por tanto, cualquier cuenta puede atender cualquier job. Eso hace el router simple y el pool lineal: 2 cuentas ≈ 2× capacidad, 5 ≈ 5×.
3. **La clave es un router con salud, presupuesto y concurrencia por cuenta.** No vale un round-robin ciego: una cuenta con 429 o con el token caducado debe salir de rotación y volver sola.
4. **Cada cuenta tiene su propio token bucket y sus propios slots.** La suma es la capacidad del pool; el 70 % es el objetivo de utilización; el resto es margen para picos.
5. **El usuario nunca debe ver “NPSSO”, “429”, “pool” ni “rate limit”.** Debe ver “Actualizando tu perfil”, “PSN está tardando”, “Tus datos guardados siguen aquí”.
6. **El onboarding debe ser progresivo:** en segundos, resumen + títulos; en minutos, horas y trofeos recientes; en segundo plano, historial completo y Vault Points. Nunca una pantalla en blanco esperando a Sony.
7. **La mejor optimización es no pedir lo que ya sabes.** `getUserTitles` da título, plataforma, progreso, contadores, icono y `lastUpdated`; no necesitas `getUserPlayedGames` ni `trophySetsOf` para pintar la biblioteca.
8. **Las definiciones de trofeos son globales.** Cacheadas una vez por `NPWR` y idioma, compartidas por todos los usuarios. Hoy se cachean por cuenta: eso multiplica llamadas sin necesidad.
9. **El scoring no debe volver a Sony.** Si guardas `psn_player_trophies`, Vault Points se calcula desde Postgres; deja de competir con el onboarding.
10. **Un solo endpoint de bootstrap** (resumen + primeros 50 juegos + recientes + estado) sustituye 4 rutas PSN en paralelo. Menos latencia, menos código, menos estados de carga.
11. **La UX de sincronización es parte del producto:** estado, fases, ETA, cooldown con cuenta atrás, “te avisamos”, errores accionables, datos parciales y accesibilidad. La transparencia reduce el soporte y la ansiedad.
12. **El pool tiene coste operativo:** cada cuenta caduca a los 60 días. Con 5 cuentas, hay que renovar una cada ~12 días si se escalonan; hay que verlo como un calendario, no como un botón.

---

## 1. Objetivos de diseño

| Objetivo | Qué significa | Cómo se mide |
|---|---|---|
| Capacidad | Absorber 10/100/1.000 registros/día sin 429 visibles | Cola p95, 429 %, onboarding p95 |
| Disponibilidad | Una cuenta caída no tumba PSN | Failover < 2 s, 0 errores visibles |
| Latencia | El perfil abre en < 400 ms desde DB | p95 de `/api/psn/bootstrap` |
| Frescura | Datos de < 6 h para activos | % perfiles frescos |
| Claridad | El usuario entiende qué pasa y qué puede hacer | Soporte, abandono en onboarding |
| Control | El admin ve y controla el pool | Cuentas activas, cola, capacidad |
| Seguridad | Los secretos no se filtran ni se pierden | Auditoría, cifrado, alertas |
| Legalidad | Uso de cuentas propias, sin automatizar login | Revisión de términos |

---

## 2. Qué cambia con varios NPSSO (y qué no)

### 2.1 Lo que sí cambia

- **Capacidad lineal:** 2 cuentas ≈ 2× llamadas/minuto; 3 ≈ 3×; 5 ≈ 5×.
- **Failover:** si una cuenta recibe 429 o su token caduca, otra sigue.
- **Mantenimiento sin parar:** puedes drenar una cuenta para rotarla mientras las demás trabajan.
- **Menos picos por cuenta:** repartes el onboarding entre varias sesiones.
- **Renovaciones escalonadas:** una cuenta caduca cada X días, no todas a la vez.
- **Mejor latencia media:** eliges la cuenta con menor latencia/cola.

### 2.2 Lo que NO cambia

- **Sony sigue teniendo límites.** El pool no elimina el 429; lo reparte.
- **La visita no debe llamar a Sony.** Sin snapshots/cola, 5 cuentas solo compran tiempo.
- **La privacidad del usuario manda.** Si su perfil es privado, ninguna cuenta puede leerlo.
- **El coste operativo.** Más cuentas = más NPSSO que renovar, más tokens que vigilar.
- **El riesgo legal.** Usa cuentas que controles; no crees cuentas falsas; no automatices el login; respeta los términos de Sony.

### 2.3 La pregunta importante: ¿el límite es por cuenta o por IP?

Antes de invertir en 5 cuentas, **mide**:

- Si el 429 aparece en una cuenta mientras otras van bien → el límite es por cuenta; el pool ayuda.
- Si el 429 aparece en todas las cuentas a la vez, aunque estén poco usadas → puede ser por IP, por dispositivo o por comportamiento; el pool no ayuda y hay que reducir ritmo, cambiar la salida o hablar con Sony.
- Si el 429 llega solo en una ruta (p. ej. `getUserTitles`) → puede ser un límite por endpoint; reparte esa ruta.

Sin esta medición, el pool es una apuesta.

---

## 3. Arquitectura

```
                         ┌──────────────────────────────┐
                         │        CheevoVault            │
                         │                              │
  usuario ──────────────>│  /api/psn/bootstrap (DB)     │
                         │  /api/psn/status   (DB)      │
                         │  /api/psn/refresh  (cola)    │
                         │                              │
                         │  ┌────────────────────────┐  │
                         │  │   Snapshot Postgres    │  │
                         │  │ players/games/trophies │  │
                         │  └───────────┬────────────┘  │
                         │              │               │
                         │  ┌───────────▼────────────┐  │
                         │  │   Cola psn_sync_jobs   │  │
                         │  │ prioridad + fases      │  │
                         │  └───────────┬────────────┘  │
                         │              │               │
                         │  ┌───────────▼────────────┐  │
                         │  │  Worker (cron/daemon)  │  │
                         │  │  presupuesto global    │  │
                         │  └───────────┬────────────┘  │
                         │              │               │
                         │  ┌───────────▼────────────┐  │
                         │  │   PsnAccountPool       │  │
                         │  │ health · leases · rate │  │
                         │  └───┬───────┬───────┬────┘  │
                         └──────│───────│───────│───────┘
                                │       │       │
                             ┌──▼─┐   ┌─▼──┐   ┌▼───┐
                             │ A1 │   │ A2 │   │ A3 │  cuentas de servicio
                             └────┘   └────┘   └────┘
                                │       │       │
                                └───────┴───────┘
                                        │
                                      Sony PSN
```

Componentes:

1. **Snapshot**: Postgres; lo que lee la web.
2. **Cola**: jobs por fase y prioridad; `FOR UPDATE SKIP LOCKED`.
3. **Worker**: cron cada minuto o proceso dedicado; ejecuta fases.
4. **Pool**: elige cuenta, aplica presupuesto y concurrencia, registra salud.
5. **Bootstrap/status**: APIs de lectura rápida para la UI.
6. **Admin**: gestión de cuentas, salud, capacidad, modo.

---

## 4. Modelo de datos

### 4.1 Cuentas de servicio

```sql
CREATE TABLE psn_service_accounts (
  id                SERIAL PRIMARY KEY,
  label             TEXT NOT NULL,                 -- "PSN-1", "principal", "reserva"
  online_id         TEXT,                          -- para que el admin la reconozca
  avatar_url        TEXT,
  region            TEXT,

  npsso             TEXT,                          -- cifrado con secretBox
  npsso_expires_at  TIMESTAMPTZ,
  refresh_token     TEXT,                          -- cifrado
  refresh_expires_at TIMESTAMPTZ,
  access_token      TEXT,                          -- cifrado
  access_expires_at TIMESTAMPTZ,

  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','quarantined','expired','draining')),
  weight            SMALLINT NOT NULL DEFAULT 1,   -- reparto
  concurrency       SMALLINT NOT NULL DEFAULT 2,   -- llamadas simultáneas
  rate_per_min      SMALLINT NOT NULL DEFAULT 40,  -- techo por cuenta
  daily_cap         INTEGER,                        -- opcional

  last_used_at      TIMESTAMPTZ,
  last_ok_at        TIMESTAMPTZ,
  last_error        TEXT,
  cooldown_until    TIMESTAMPTZ,
  failure_count     SMALLINT NOT NULL DEFAULT 0,
  warned_at         TIMESTAMPTZ,

  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX psn_accounts_ready
  ON psn_service_accounts (status, cooldown_until);
```

Reglas:

- `npsso`, `refresh_token` y `access_token` **nunca** se devuelven al cliente ni se escriben en logs.
- `label` y `online_id` son para el admin; no se muestran al usuario.
- `weight` permite dar más capacidad a una cuenta más “vieja” o más fiable.
- `concurrency` y `rate_per_min` se ajustan con medidas, no con intuición.
- `daily_cap` es opcional; sirve para no quemar una cuenta. Mejor un presupuesto suave que un corte a medianoche.

### 4.2 Slots y presupuesto por cuenta

```sql
CREATE TABLE psn_account_leases (
  account_id  INTEGER NOT NULL REFERENCES psn_service_accounts(id) ON DELETE CASCADE,
  slot        SMALLINT NOT NULL,
  leased_until TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (account_id, slot)
);

CREATE TABLE psn_account_budget (
  account_id INTEGER PRIMARY KEY REFERENCES psn_service_accounts(id) ON DELETE CASCADE,
  tokens     REAL NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `leases`: una fila por slot (0..concurrency-1). Un worker toma un slot libre con `leased_until < NOW()` y lo renueva/libera.
- `budget`: token bucket por cuenta; capacidad = burst, rate = `rate_per_min / 60`.
- La suma de presupuestos es la capacidad del pool; no hace falta un presupuesto global separado si cada cuenta lo respeta.
- Si un worker muere, el lease expira y otro lo reclaima.

### 4.3 Salud y métricas

```sql
CREATE TABLE psn_account_stats (
  account_id  INTEGER NOT NULL REFERENCES psn_service_accounts(id) ON DELETE CASCADE,
  minute      TIMESTAMPTZ NOT NULL,
  calls       INTEGER NOT NULL DEFAULT 0,
  ok          INTEGER NOT NULL DEFAULT 0,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  auth_errors  INTEGER NOT NULL DEFAULT 0,
  server_errors INTEGER NOT NULL DEFAULT 0,
  p95_ms      INTEGER,
  PRIMARY KEY (account_id, minute)
);
```

Retención 7–14 días. No guardar URLs, tokens ni datos de usuario; solo agregados.

### 4.4 Cola de sync

```sql
CREATE TABLE psn_sync_jobs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase        TEXT NOT NULL,              -- summary | titles | recent | history | score
  priority     SMALLINT NOT NULL DEFAULT 5,
  run_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'queued',
  attempts     SMALLINT NOT NULL DEFAULT 0,
  locked_by    TEXT,
  locked_until TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX psn_sync_jobs_one_active
  ON psn_sync_jobs (user_id, phase)
  WHERE status IN ('queued','running');
```

### 4.5 Snapshot

Ver `docs/psn-scaling-and-rate-limits.md` para el detalle de `psn_players`, `psn_player_games`, `psn_player_trophies`, `psn_games` y `psn_trophies`. Aquí solo añadimos:

- `psn_players.sync_state` (`not_linked`, `linked_unverified`, `syncing_core`, `ready_partial`, `enriching`, `ready`, `stale`, `error`).
- `psn_players.sync_phase`, `sync_progress`, `last_synced_at`, `next_sync_at`, `last_error`.
- `psn_players.verified_at`.

---

## 5. Ciclo de vida de una cuenta

```
          add + validar
                │
                ▼
   ┌────────  active  ◀─────────────┐
   │            │                   │
   │      429/5xx                   │ éxito
   ▼            ▼                   │
cooldown ── expira ──> active ──────┘
   │
   │ 401/403 de auth o ban
   ▼
quarantined ── revisión manual ──> active
   │
   │ admin
   ▼
paused / draining ──> removed
```

### 5.1 Alta

1. El admin inicia sesión en la cuenta de PSN en un navegador privado.
2. Copia el NPSSO de `https://ca.account.sony.com/api/v1/ssocookie`.
3. Lo pega en **Admin → PSN Accounts → Add account**, con una etiqueta (`PSN-2`), peso y concurrencia.
4. El servidor:
   - valida el formato (64 letras/números),
   - pide a Sony la caducidad (`npssoExpiry`),
   - intercambia el NPSSO por tokens (`verifyNpsso`),
   - hace una llamada canaria a su propio perfil (1 llamada),
   - guarda todo cifrado y devuelve `online_id`, `avatar_url`, `expires_at`.
5. La cuenta queda `active` y entra en rotación.

**No** se debe usar la cuenta personal del admin como cuenta de servicio si se puede evitar: una cuenta dedicada, sin compras ni datos personales, es más segura y más fácil de renovar.

Checklist para añadir varias:

- [ ] Cuenta dedicada, con correo propio y contraseña única.
- [ ] Perfil de PSN con el historial de juego público.
- [ ] Sin compras, suscripciones ni datos personales.
- [ ] NPSSO copiado justo después de iniciar sesión (caduca a los 60 días).
- [ ] Añadir **una cuenta por semana**, no las cinco el mismo día.
- [ ] Probar la canaria y ver el `online_id` correcto.
- [ ] Apuntar la fecha de caducidad en un calendario.
- [ ] Etiquetar (`PSN-1`, `PSN-2`, `reserva`) y no reutilizar la personal.
- [ ] Si una cuenta es nueva, úsala primero para poco volumen; las cuentas “viejas” aguantan mejor.

### 5.2 Cooldown por 429

- `failure_count++`.
- `cooldown_until = NOW() + min(300, 30 * 2^failure_count) + jitter`.
- `status` sigue `active`, pero el router la ignora hasta que pase.
- Si vuelve a fallar, el cooldown crece; si acierta, `failure_count = 0`.
- No reintentar en caliente; el job se reprograma.

### 5.3 Cuarentena por auth/ban

- `401`, refresh token inválido o NPSSO caducado → `quarantined`.
- `403` de un perfil privado **no** es culpa de la cuenta: no se penaliza.
- `403` repetido en muchos perfiles distintos y con una cuenta concreta → sospecha; cuarentena y revisión.
- Alerta al admin con la etiqueta de la cuenta, no con el token.

### 5.4 Drenaje y retirada

- `draining`: no acepta jobs nuevos; termina los que tiene.
- Cuando queda a 0, `paused`.
- `removed`: se borran los secretos; se conserva la fila de auditoría si hace falta, sin tokens.
- Si era la única cuenta, PSN pasa a `stale` y se avisa.

### 5.5 Renovación escalonada (importante)

El NPSSO dura **60 días desde el sign-in**, no desde el último uso. Si añades 5 cuentas el mismo día, las 5 caducan el mismo día. Eso es un incidente garantizado.

- Añade las cuentas en días distintos, o renueva una cada semana.
- El cron debe avisar **por cuenta**: 7 días, 3 días, 1 día.
- Mantén al menos una cuenta con **> 14 días** de vida.
- La cuenta de reserva debe tener una fecha de caducidad distinta a las de carga.
- Si una cuenta caduca, el pool sigue; el usuario no debe notarlo.

### 5.6 Rotación de NPSSO

- El admin pega un NPSSO nuevo para una cuenta existente.
- Se validan tokens y se hace canaria.
- Se reemplazan los tokens viejos; se limpia el estado de error.
- Si la rotación falla, la cuenta anterior sigue activa hasta que se confirme; no la borres antes.

---

## 6. Router y selección de cuenta

### 6.1 Reglas

Una llamada se puede atender por cualquier cuenta `active` que:

1. no esté en `cooldown_until`;
2. tenga un slot libre (`concurrency`);
3. tenga tokens válidos o pueda refrescar;
4. tenga tokens en su bucket.

Orden de preferencia:

1. **Salud** (sin errores recientes, latencia baja).
2. **Slots libres** (menos ocupada).
3. **Tokens disponibles** (más margen).
4. **Peso** (cuentas más fiables reciben más).
5. **Último uso** (reparto justo).

### 6.2 Implementación

```ts
type Lease = {
  accountId: number
  auth: AuthorizationPayload
  release(): Promise<void>
}

class PsnAccountPool {
  async acquire(opts: { priority: number; userId?: number }): Promise<Lease> {
    // 1. fila de cuenta + slot libre (FOR UPDATE SKIP LOCKED)
    // 2. token del bucket
    // 3. load token/refresh si hace falta
    // 4. devolver lease con release()
  }

  async reportSuccess(accountId: number, ms: number) { /* ewma, reset failures */ }
  async reportRateLimit(accountId: number, retryAfter?: number) { /* cooldown */ }
  async reportAuthError(accountId: number) { /* quarantine */ }
  async reportServerError(accountId: number) { /* cooldown corto */ }
}
```

Selección aproximada en SQL (el `FOR UPDATE SKIP LOCKED` evita que dos workers cojan el mismo slot):

```sql
SELECT a.id, l.slot
FROM psn_service_accounts a
JOIN LATERAL generate_series(0, a.concurrency - 1) AS l(slot) ON TRUE
LEFT JOIN psn_account_leases l2
  ON l2.account_id = a.id AND l2.slot = l.slot
WHERE a.status = 'active'
  AND a.cooldown_until <= NOW()
  AND (l2.leased_until IS NULL OR l2.leased_until < NOW())
ORDER BY a.weight DESC, a.last_used_at NULLS FIRST, random()
LIMIT 1
FOR UPDATE OF a SKIP LOCKED;
```

Luego se hace `INSERT ... ON CONFLICT (account_id, slot) DO UPDATE SET leased_until = ...` con el slot elegido. En la práctica, envuelve selección + lease en una sola función SQL o transacción para que no haya carrera.

Uso:

```ts
export async function withPsnAccount<T>(
  fn: (auth: AuthorizationPayload) => Promise<T>,
  opts: { priority: number; userId?: number } = { priority: 2 },
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    const lease = await pool.acquire(opts)
    const started = Date.now()
    try {
      await takeToken(lease.accountId)
      const result = await fn(lease.auth)
      await pool.reportSuccess(lease.accountId, Date.now() - started)
      return result
    } catch (err) {
      if (isRateLimited(err)) {
        await pool.reportRateLimit(lease.accountId)
        lastError = err
        continue // otra cuenta
      }
      if (isAuthError(err)) {
        await pool.reportAuthError(lease.accountId)
        lastError = err
        continue // otra cuenta
      }
      if (isPrivate(err)) throw err // no es culpa de la cuenta
      await pool.reportServerError(lease.accountId)
      lastError = err
    } finally {
      await lease.release()
    }
  }
  throw lastError
}
```

Reglas de reintento:

- **429**: otra cuenta, máximo 2 reintentos; luego backoff.
- **401**: cuarentena de esa cuenta, otra cuenta; si todas fallan, stale.
- **403 privado**: no reintentar; es el perfil del usuario.
- **5xx/timeout**: otra cuenta una vez; luego stale.
- **Nunca** reintentar un 403 como si fuera 429.

### 6.3 Sin afinidad por usuario

Cualquier cuenta puede leer cualquier perfil público. Eso significa:

- No hay que migrar datos al añadir una cuenta.
- No hay “esta cuenta sigue a este usuario”.
- No hay que reautenticar al usuario.
- El pool es **stateless**; escala horizontalmente.

Si en el futuro PSN exige amistad para algún dato (presencia, por ejemplo), se añade una afinidad explícita solo para ese dato; no para trofeos.

### 6.4 Fairness

- Un usuario no puede acaparar el pool: máximo 1 job activo por fase, y jobs pequeños (20 juegos).
- Prioridades: link/verify 0, manual 1, primer sync 2, cron 3, historial 4, score 5.
- Los jobs de historial se reencolan al final tras cada chunk; así una biblioteca de 5.000 juegos no bloquea a un usuario nuevo.
- Si la cola supera X, se pausan historial y score; solo core.

---

## 7. Presupuesto y concurrencia

### 7.1 Por cuenta

- `rate_per_min`: empieza en **40** (el techo conservador actual).
- `concurrency`: empieza en **2**.
- Capacidad efectiva = `rate_per_min * 0.7` (margen para picos y para no rozar el límite).
- Con 3 cuentas: 84 llamadas/min efectivas; con 5: 140/min.

### 7.2 Token bucket por cuenta

Igual que en `docs/psn-scaling-and-rate-limits.md`, pero con `account_id`:

```sql
SELECT tokens, updated_at FROM psn_account_budget
WHERE account_id = $1 FOR UPDATE;
-- reponer: min(capacity, tokens + rate_per_sec * elapsed)
-- si tokens < 1: devolver false (probar otra cuenta)
-- si no: tokens - 1
```

### 7.3 Slots

- `psn_account_leases` con `concurrency` filas por cuenta.
- Un worker toma un slot con `leased_until < NOW()`; renueva cada 30 s si la operación es larga; libera al terminar.
- Si el worker muere, el slot expira.
- No confíes solo en un semáforo en memoria: en Vercel hay varias instancias.

### 7.4 Capacidad y saturación

- Si todas las cuentas están en cooldown o sin tokens: el job se reprograma con jitter; la UI muestra “PSN está tardando”.
- Si la cola crece: bajar prioridad de historial/score; no aceptar más manual refresh; mostrar ETA honesto.
- Si la utilización media > 70 % durante 1 h: añadir cuenta o bajar profundidad.

---

## 8. Sincronización optimizada

### 8.1 Fases (no bloquean la UI)

| Fase | Datos | Coste | Prioridad | Cuándo |
|---|---|---:|---:|---|
| `summary` | Nivel, avatar, Plus, totales | 3 | 0 | Al enlazar |
| `titles` | Biblioteca con progreso | 1–2/800 | 0 | Al enlazar |
| `recent` | Últimos 20 juegos: trofeos, horas, arte | ~45 | 2 | 1–5 min después |
| `history` | Trofeos por juego del último año | 2/juego | 4 | Background |
| `score` | Vault Points desde DB | 0 | 5 | Después de history |

### 8.2 Core vs enriquecimiento

```ts
// 1–2 llamadas; pinta la biblioteca
psnTitlesCore(accountId)

// background; añade horas, arte de tienda, colecciones
psnTitlesEnriched(accountId, { recentOnly: 20 })
```

`psnTitlesCore` **no** llama a `getUserPlayedGames` ni a `trophySetsOf`. Esos datos son “nice to have”, no identidad.

### 8.3 Delta sync

En cada refresh:

1. `getUserTitles` (1–2 llamadas) y compara `lastUpdatedDateTime` / contadores con el snapshot.
2. Solo los juegos cuyo `lastTrophyAt` cambió necesitan `psnGameTrophies`.
3. `getUserPlayedGames` solo si cambió `lastPlayedDateTime` o si el juego es nuevo.
4. `history` solo para juegos nuevos o cambiados.
5. `score` se recalcula desde `psn_player_trophies`; sin Sony.

Con esto, un refresh normal de un usuario activo son **1–2 llamadas + los juegos que se movieron**, no 300.

### 8.4 Definiciones globales

```
psn:defs:${npwr}:${lang}          // una vez para todos, 90 días
psn:earned:${accountId}:${npwr}:${lastTrophyAt} // por usuario, 30 días

psn:groups-defs:${npwr}:${lang}
psn:groups-earned:${accountId}:${npwr}
```

Hoy `psnGameTrophies` cachea definiciones + ganados por cuenta; eso multiplica llamadas. Separarlo es una de las mayores ganancias.

### 8.5 Bootstrap: una sola llamada

Hoy el panel pide `summary`, `titles`, `recent` y `year` por separado. Mejor:

```http
GET /api/psn/bootstrap?user=...
```

Respuesta:

```json
{
  "user": { "onlineId": "...", "avatar": "...", "verified": true, "level": 512, "tier": 8 },
  "summary": { "games": 1240, "platinum": 98, "trophies": 18420, "playtimeMinutes": 207000 },
  "games": { "items": [ ...50... ], "total": 1240, "hasMore": true },
  "recentTrophies": [ ...6... ],
  "rarest": [ ...5... ],
  "sync": {
    "state": "ready_partial",
    "lastSyncedAt": "2026-10-23T07:10:00Z",
    "nextSyncAt": "2026-10-23T13:10:00Z",
    "phases": { "summary": "done", "titles": "done", "recent": "running", "history": "queued" },
    "progress": 0.42,
    "etaSeconds": 180,
    "canRefresh": false,
    "refreshAvailableAt": "2026-10-23T07:25:00Z"
  }
}
```

- Un solo round trip; la UI pinta en una pasada.
- Si no hay snapshot, devuelve 202 con `state: "syncing"` y los datos mínimos (online ID, avatar) para un skeleton con sentido.
- Los juegos se paginan server-side (50); no se manda la biblioteca completa.
- `ETag`/`If-None-Match` para evitar re-render si nada cambió.

### 8.6 Paginación y DTOs

- `GET /api/psn/games?page=1&limit=50&q=&sort=...` → 50 por página.
- `GET /api/psn/game/[npwr]` → juego + trofeos + grupos + estado en una respuesta.
- Eliminar `meta` duplicada; DTO ligero.
- Imágenes por proxy/CDN; `next/image` con allowlist.

### 8.7 Caché y frescura

- **L1:** memoria por instancia para definiciones y summaries (LRU).
- **L2:** Postgres (`steam_cache`/snapshots).
- **Público:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` en perfiles/juegos públicos; `revalidateTag` al sincronizar.
- **Privado:** `private, max-age=...`, `Vary: Cookie`.
- **Stale:** si el snapshot tiene < 7 días, se sirve con badge “actualizado hace X”; refresh en background.
- **Negativa:** privado/no encontrado, 10 min/1 h.

---

## 9. UX: que no parezca un sistema de colas

### 9.1 Máquina de estados

```
not_linked
  → linked_unverified
    → syncing_core
      → ready_partial
        → enriching
          → ready
  ↘ error_private
  ↘ error_unavailable
  ↘ paused
```

- `ready_partial` es usable: trofeos y biblioteca ya están.
- `enriching` no bloquea; solo faltan horas/historial.
- `stale` es un overlay, no un estado roto.

### 9.2 Viaje del usuario

1. **Conectar PSN:** escribe online ID; se muestra avatar/nombre para confirmar.
2. **Verificar:** código, botón “Copiar”, enlace a PSN, “Ya lo pegué, comprobar”. Se puede saltar.
3. **Primer pintado:** skeleton con avatar/nombre reales; “Leyendo tus trofeos…”.
4. **En segundos:** biblioteca y contadores; “Tus trofeos ya están”.
5. **En minutos:** horas, último jugado, recientes; “Añadiendo horas de juego”.
6. **En background:** historial/heatmap; “Calculando tu historial”.
7. **Listo:** “Perfil actualizado hace 2 min · Próxima actualización en 6 h”.
8. **Compartir:** tarjeta/OG; “Tu perfil está listo”.

### 9.3 Wireframe del estado

```
┌──────────────────────────────────────────────────────────┐
│  [avatar]  Tu perfil de PSN                              │
│            Verificado · Nivel 512 · PS Plus              │
│                                                          │
│  ✓ Trofeos          ✓ Biblioteca                         │
│  ◐ Horas de juego   ○ Historial                          │
│  ████████████░░░░░░  72 %                                │
│  Listo en unos 2 min · Puedes seguir usando CheevoVault  │
│                                                          │
│  Última actualización: hace 12 min                       │
│  [Actualizar ahora]  (disponible en 08:42)               │
└──────────────────────────────────────────────────────────┘
```

En móvil, el mismo estado en una hoja inferior que no tapa el perfil; se puede cerrar y volver a abrir desde un chip.

### 9.4 Copys (sin jerga)

| Estado | Texto |
|---|---|
| `syncing_core` | “Estamos leyendo tus trofeos. Suele tardar unos segundos.” |
| `ready_partial` | “Tus trofeos ya están. Estamos añadiendo horas de juego e historial en segundo plano.” |
| `queued` | “Tu actualización está en cola (posición 2). Puede tardar unos minutos.” |
| `stale` | “Mostrando datos de hace 8 h. Actualizando en segundo plano.” |
| `cooldown` | “Podrás actualizar de nuevo en 8 min.” |
| `private` | “Tu historial de PSN es privado. Cámbialo en Ajustes → Privacidad → Historial de juego y vuelve a intentarlo.” |
| `psn_down` | “PSN no responde. Tus datos guardados siguen disponibles; reintentaremos automáticamente.” |
| `all_accounts_down` | “PSN está en mantenimiento. Tus datos siguen aquí.” |
| `unverified` | “Sin verificar: no aparecerás en rankings hasta verificar la cuenta.” |
| `verified` | “Cuenta verificada.” |
| `no_games` | “No encontramos juegos con trofeos en esta cuenta.” |
| `partial_history` | “Historial en cálculo: 320 de 1.240 juegos.” |

Nunca:

- “NPSSO”.
- “429”.
- “Rate limit”.
- “Pool”.
- “Token”.
- “Job”.
- Códigos de error crudos.

### 9.5 Progreso y ETA

- Barra por fases, no un spinner infinito.
- `aria-valuenow` y `aria-valuetext` reales.
- ETA redondeado (“unos 2 min”), nunca una promesa exacta.
- Si el ETA supera 30 min: “Puede tardar; te avisamos cuando termine”.
- Si el usuario cierra la pestaña, el job sigue; al volver, ve el estado.

### 9.6 Cooldown amable

- Botón “Actualizar ahora” deshabilitado con cuenta atrás: “Disponible en 08:42”.
- Si pulsa antes: toast “Ya estamos actualizando; podrás volver a pedirlo en 8 min”.
- No castigar con error; explicar.
- Auto-refresh cada 6 h; no hace falta que el usuario haga nada.

### 9.7 Errores accionables

| Error | UI | Acción |
|---|---|---|
| `private` | “Tu historial es privado” | Enlace a la guía de privacidad; botón “Ya lo cambié” |
| `not_found` | “No encontramos ese ID” | Revisar mayúsculas/guiones; buscar de nuevo |
| `rate_limited` | “PSN está lento” | Reintento automático; datos guardados |
| `auth_expired` | “No podemos conectar con PSN” | Aviso interno; el usuario no ve el detalle |
| `timeout` | “PSN tardó demasiado” | Reintento; datos guardados |
| `no_games` | “No hay trofeos” | Explicar que el perfil puede ser nuevo o privado |
| `unverified` | “Sin verificar” | “Verificar ahora” |

### 9.8 Notificaciones

- Toast cuando termina el sync si el usuario sigue en la app.
- Web Push/email opcional: “Tu perfil de PSN está listo”.
- No notificar cada fase; solo core listo y sync completo.
- Si el usuario pidió refresh manual, avisar al terminar.

### 9.9 Accesibilidad e i18n

- `role="status"`/`aria-live="polite"` para el estado.
- No usar solo color; texto “Actualizando”/“Listo”.
- `prefers-reduced-motion` para animaciones de progreso.
- Todos los copys en los 9 idiomas; nada hardcodeado.
- En móvil, el estado en una hoja inferior o chip, no un modal que tape el perfil.
- Teclado y foco visible en “Actualizar”, “Copiar”, “Verificar”.

### 9.10 Privacidad

- Público/privado por usuario; por defecto privado.
- Ocultar juegos/trofeos.
- “Verificado” solo si el usuario quiere mostrarlo.
- Borrar snapshots al desenlazar.
- No mostrar la cuenta de servicio ni su online ID.

---

## 10. UX del admin: el pool en una pantalla

### 10.1 Dashboard

```
PSN Pool
┌────────────────────────────────────────────────────────────┐
│ Capacidad: 84/min efectivas · Cola: 12 · 429: 0.4 %        │
│ Cuentas: 3 activas · 1 en cooldown · 1 reserva              │
│ Próxima caducidad: PSN-2 en 6 días                          │
├────────────────────────────────────────────────────────────┤
│ PSN-1  ● Activa   40/min  2 slots  0.1 %  p95 210ms  →     │
│ PSN-2  ● Activa   40/min  2 slots  0.3 %  p95 240ms  →     │
│ PSN-3  ◐ Cooldown 40/min  0 slots  8.0 %  hasta 12:04 →    │
│ PSN-R  ○ Reserva  —       —        —      —          →     │
└────────────────────────────────────────────────────────────┘
[Add account] [Drain all] [PSN mode: live ▾] [Test pool]
```

### 10.2 Acciones

- **Add account:** etiqueta + NPSSO + peso/concurrencia; valida y hace canaria.
- **Test:** 1 llamada al propio perfil; muestra latencia y online ID.
- **Pause/Resume:** deja de recibir jobs.
- **Drain:** termina los actuales y sale de rotación.
- **Rotate:** pega un NPSSO nuevo; valida antes de reemplazar.
- **Remove:** borra secretos; conserva auditoría sin tokens.
- **Mode:** `live` (normal), `queue` (solo core), `stale` (sin Sony).
- **Reset cooldown** de una cuenta concreta.

### 10.3 Alertas

- Cuenta caduca en 7/3/1 días.
- 429 > 5 % en una cuenta durante 5 min.
- 401/403 de auth en una cuenta.
- Pool con < 2 cuentas activas.
- Cola p95 > 15 min.
- 0 llamadas de una cuenta activa en 1 h (¿mal configurada?).

---

## 11. Capacidad con N cuentas

Supuestos: 40 llamadas/min por cuenta, 70 % de utilización efectiva (28/min), 50 % de registros enlazan PSN, 500 juegos, 313 llamadas para sync completo, 4 para onboarding rápido, 45 para enriquecer 20 juegos.

| Registros/día | Enlaces | Onboarding rápido | Enriquecimiento | Sync completo |
|---:|---:|---:|---:|---:|
| 10 | 5 | 20 llamadas | 225 | 1.565 |
| 100 | 50 | 200 | 2.250 | 15.650 |
| 1.000 | 500 | 2.000 | 22.500 | 156.500 |
| 10.000 | 5.000 | 20.000 | 225.000 | 1.565.000 |

Tiempo estimado con N cuentas (28 llamadas/min efectivas por cuenta):

| Trabajo | 1 cuenta | 2 cuentas | 3 cuentas | 5 cuentas |
|---|---:|---:|---:|---:|
| Onboarding 1.000/día (2.000 llamadas) | 71 min | 36 min | 24 min | 14 min |
| Enriquecimiento 1.000/día (22.500) | 13,4 h | 6,7 h | 4,5 h | 2,7 h |
| Sync completo 1.000/día (156.500) | 93 h | 46,5 h | 31 h | 18,6 h |
| Sync completo 10.000/día (1.565.000) | 931 h | 465 h | 310 h | 186 h |

Lectura:

- **2 cuentas** ya dan un margen enorme para 100/día y permiten failover.
- **3 cuentas** hacen que 1.000/día con sync completo quepa en ~31 h; si aceptas 2–3 días de cola, es suficiente.
- **5 cuentas** bajan el sync completo de 1.000/día a ~18,6 h y dan holgura para picos; es un buen objetivo si esperas crecer.
- **10.000/día** con sync completo no es viable ni con 5 cuentas; para hacerlo en un día necesitarías ~30–40 cuentas (o reducir profundidad/frecuencia). No es un escenario realista de un solo pool pequeño.

### 11.1 Con 5 cuentas: flujo diario

No todas las visitas consumen NPSSO. **Ver un perfil es Postgres**; solo consumen llamadas:

- enlazar/verificar,
- sync inicial,
- enriquecimiento (horas, arte, recientes),
- historial,
- refresh periódico,
- score (si no se calcula desde la DB).

Supuestos conservadores:

- 40 llamadas/min por cuenta y **70 % de utilización** → 28/min por cuenta.
- 5 cuentas → **140 llamadas/min** → **201.600 llamadas/día**.
- Coste por usuario nuevo:
  - **core** (resumen + títulos): ~4 llamadas.
  - **core + recientes** (20 juegos): ~50.
  - **+ historial de 100 juegos**: ~250.
  - **+ historial de 300 juegos**: ~650.
- Refresh de un usuario activo con delta sync: **~20 llamadas/día** (4 refrescos × ~4 llamadas + juegos que se movieron).
- Score desde Postgres: **0 llamadas** (si todavía se lee de Sony, suma 2 por juego y cambia todo el cálculo).

Capacidad pura de usuarios nuevos (sin refresh de activos):

| Coste por usuario nuevo | Enlaces PSN/día | Si el 50 % de registros enlaza PSN | Si el 30 % enlaza PSN |
|---|---:|---:|---:|
| ~50 (core + recientes) | **4.032** | ~8.000 registros | ~13.400 registros |
| ~250 (+ historial 100 juegos) | **806** | ~1.600 registros | ~2.700 registros |
| ~650 (+ historial 300 juegos) | **310** | ~620 registros | ~1.030 registros |

Mezcla realista con usuarios activos (5.000 activos × 20 llamadas = 100.000/día):

| Escenario | Llamadas/día | Uso de 5 cuentas | ¿Cabe? |
|---|---:|---:|---|
| 500 enlaces + 5.000 activos (core + recientes) | 125.000 | 62 % | Sí, holgado |
| 1.000 enlaces + 5.000 activos (core + recientes) | 150.000 | 74 % | Sí, buen punto |
| 2.000 enlaces + 5.000 activos (core + recientes) | 200.000 | 99 % | Al límite; sin margen para picos |
| 1.000 enlaces + 10.000 activos | 250.000 | 124 % | No |
| 500 enlaces con historial 100 + 5.000 activos | 225.000 | 112 % | No |
| 400 enlaces con historial 100 + 5.000 activos | 200.000 | 99 % | Al límite |
| 150 enlaces con historial 300 + 5.000 activos | 197.500 | 98 % | Al límite |

Lectura práctica:

- **Con 5 cuentas, el punto cómodo es ~1.000 enlaces PSN/día + ~5.000 usuarios activos/día**, con onboarding rápido + recientes y el historial en cola.
- Si el 50 % de los registros enlaza PSN, eso son **~2.000 registros/día**. Si solo enlaza el 30 %, son **~3.300 registros/día**.
- Si cada usuario nuevo exige historial completo de 100 juegos, el punto cómodo baja a **~400 enlaces/día** con 5.000 activos → **~800 registros/día** al 50 %.
- Si además las bibliotecas son grandes (300 juegos con trofeos recientes), baja a **~150 enlaces/día** → **~300 registros/día** al 50 %.
- **Solo usuarios activos, sin nuevos:** 5 cuentas aguantan **~10.000 activos/día** a 20 llamadas/día.
- **Vistas de perfil:** no consumen NPSSO; puedes tener mucho más tráfico de lectura que de sync.

Picos: 1.000 enlaces en una hora necesitan ~50.000 llamadas/hora = ~833/min; 5 cuentas a 140/min no pueden. La cola los reparte (unas 6 h) y la UI debe mostrar ETA. Para lanzamientos o campañas, o se añaden cuentas o se acepta cola.

Sony no publica el límite real: 40/min es un techo conservador de CheevoVault, no una verdad de Sony. Si el límite real es 20/min por cuenta, divide la tabla por 2; si es 60, súbela un 50 %. Y si el 429 es por IP y no por cuenta, 5 cuentas no multiplican: hay que medirlo.

Si una de las 5 es reserva y solo 4 están activas, la capacidad baja ~20 % (112/min, ~161.000/día). Mejor tener las 5 activas con pesos y una tratada como “reserva en caliente” (peso bajo), no una cuenta fría que caduca sin usarse.

**Cuántas añadir ahora:**

| Si esperas… | Cuentas recomendadas | Por qué |
|---|---:|---|
| 10–100 registros/día | **2** (1 principal + 1 reserva) | Failover y margen; no necesitas más |
| 1.000/día con historial en 2–3 días | **3** | Onboarding rápido y enriquecimiento cómodos |
| 1.000/día con historial el mismo día | **5** | ~18,6 h de sync completo; margen para picos |
| 10.000/día | **~30–40** o rediseñar profundidad | El sync completo no cabe en un pool pequeño |

**Cuándo añadir cuenta:**

- utilización > 70 % durante 1 h;
- cola p95 de nuevos > 5 min;
- 429 > 1 %;
- una cuenta caduca en < 14 días (añade la reserva antes).

---

## 12. Seguridad y legal

### 12.1 Secretos

- Cifra `npsso`, `refresh_token` y `access_token` con `secretBox`.
- **Mejora recomendada:** usa una clave dedicada `PSN_SECRET_KEY` con versiones (`key_id`) en lugar de depender de `NEXTAUTH_SECRET`. Si rotas el secreto de auth, hoy todos los secretos PSN se vuelven ilegibles.
- Nunca devuelvas tokens al cliente; el admin solo ve etiqueta, online ID, caducidad y salud.
- No escribas tokens en logs, errores ni URLs.
- Limita los endpoints de admin y registra cada acción (`logAdminAction`).

### 12.2 Cuentas

- Usa cuentas que controles; no crees cuentas falsas.
- No automatices el login de Sony (captcha/2FA); el NPSSO se pega a mano.
- Cuentas dedicadas, sin compras ni datos personales.
- 2FA en las cuentas si es compatible con la extracción de NPSSO; si no, al menos contraseña única y correo dedicado.
- Revisa los términos de Sony y el riesgo de baneo; ten un plan B (partner/oficial o reducir alcance).

### 12.3 Datos

- Solo datos públicos de trofeos; no mensajes, amigos ni datos privados.
- Borra snapshots y secretos al desenlazar/eliminar.
- Respeta `profilePublic` y las preferencias de ocultar.
- No uses Exophase/YourGamerProfile como fuente de datos.

---

## 13. Implementación

### Fase 0 — Medir (2–3 días)

- Instrumenta llamadas por función, 429, latencia y errores.
- Comprueba si el 429 es por cuenta o por IP.
- Establece la línea base de un perfil frío y de un refresh.

### Fase 1 — Parar el sangrado (1 semana)

- `psnTitlesCore` sin jugados/sets.
- Presupuesto global para todas las llamadas.
- Caché negativa + stale-while-revalidate + single-flight.
- Cooldown manual y “last synced”.
- No cargar el heatmap anual en el primer render.

### Fase 2 — Pool (1–2 semanas)

- Migración `psn_service_accounts`, `psn_account_leases`, `psn_account_budget`, `psn_account_stats`.
- `PsnAccountPool` + router + reintentos.
- Admin: listar, añadir, probar, pausar, drenar, rotar.
- Migrar la cuenta actual a `psn_service_accounts`; mantener `psn_credentials` como fallback.
- Añadir 2 cuentas y canary.

### Fase 3 — Snapshots y cola (2–3 semanas)

- `psn_players`, `psn_player_games`, `psn_player_trophies`, `psn_sync_jobs`.
- Worker `/api/cron/psn-worker`; fases.
- Bootstrap/status APIs; serving desde DB.
- Delta sync; score desde DB.
- Separar `psn:defs` / `psn:earned`.

### Fase 4 — UX y admin (1–2 semanas)

- Estados, progreso, ETA, copys, accesibilidad.
- Notificaciones/toasts.
- Dashboard del pool, alertas, modo stale.
- Onboarding verificado.

### Fase 5 — Escala (continuo)

- Añadir cuentas 3–5 según métricas.
- Test de carga 10/100/1.000/10.000.
- Chaos: 429, 401, 5xx, token caducado, worker muerto.
- Ajustar rates y concurrencia.

### Archivos orientativos

```
src/lib/psn/accounts.ts        # pool, leases, salud
src/lib/psn/credentials.ts     # secretos por cuenta, tokens
src/lib/psn/budget.ts          # token buckets
src/lib/psn/queue.ts           # jobs, fases
src/lib/psn/sync/*             # summary/titles/recent/history/score
src/lib/psn/client.ts          # withPsnAccount, psnCall
src/app/api/psn/bootstrap/     # lectura rápida
src/app/api/psn/status/        # estado para la UI
src/app/api/psn/refresh/       # 202 + cola
src/app/api/admin/psn/accounts/
src/components/psn-sync-status/
src/components/admin-panel/admin-psn-accounts/
migrations/0xx_psn_service_accounts.sql
```

---

## 14. Métricas, SLOs y runbook

### SLOs

- 99,9 % de lecturas de perfil desde DB (sin Sony).
- p95 de `/api/psn/bootstrap` < 400 ms.
- 99 % de nuevos enlaces con core listo < 60 s.
- 99 % de perfiles activos con sync < 6 h.
- 429 < 1 %.
- Cola p95: nuevos < 5 min; historial < 30 min.
- Disponibilidad del pool > 99,9 %.

### Alertas

- 429 > 1 % 5 min.
- Cola p95 > 15 min.
- Una cuenta con 401/403 de auth.
- Una cuenta caduca en < 7 días.
- Menos de 2 cuentas activas.
- p95 de bootstrap > 1 s (señal de que se está yendo a Sony).
- Un usuario con más de 60 llamadas/min (bucle/abuso).

### Runbook

1. **429:** bajar `rate_per_min`, pausar historial/score, servir stale, revisar si es por IP.
2. **Cuenta 401:** cuarentena, rotar NPSSO, canary; el pool sigue.
3. **Todas las cuentas caídas:** `PSN_MODE=stale`; avisar; renovar; volver a `live`.
4. **Cola atascada:** reclaim jobs `running` con lease vencido; revisar worker.
5. **Pico de registros:** priorizar summary/titles; historial/score en pausa; ETA honesto.
6. **Una cuenta sospechosa:** drenar, no usar para nuevos jobs, revisar.

---

## 15. Testing y caos

- **Unit:** selección de cuenta, cooldown, token bucket, leases, reintentos, prioridades.
- **Integración:** adapter falso de Sony con latencia, 429, 401, 5xx y timeouts.
- **Carga:** 10, 100, 1.000 y 10.000 enlaces simulados; medir cola, p95, 429, utilización.
- **Caos:**
  - una cuenta 429;
  - una cuenta 401;
  - todas las cuentas 429;
  - token caducado;
  - worker muerto con lease;
  - DB lenta;
  - biblioteca de 5.000 juegos.
- **E2E:** enlazar → verificar → core listo → enriquecido → refresh con cooldown → error privado → reintento.
- **Accesibilidad:** axe/Lighthouse; teclado; `aria-live`; reduced motion.

Criterios de aceptación:

- Ningún 5xx visible por un pico de 100 enlaces.
- Un enlace nuevo tiene core en < 60 s p95.
- Si una cuenta cae, el usuario no ve error.
- Si todas caen, se sirve stale y se avisa.
- El pool no supera el 70 % de utilización en régimen normal.

---

## 16. Qué no hacer

- **No añadir cuentas sin cola/persistencia.** Solo retrasa el 429.
- **No hacer round-robin ciego.** Ignora salud, cooldown y presupuesto.
- **No repartir por usuario.** No hace falta y complica la migración.
- **No reintentar 429 en la misma cuenta.** Cooldown y otra cuenta.
- **No tratar un 403 privado como fallo de cuenta.** Es del perfil.
- **No mostrar jerga al usuario.** “NPSSO”, “429”, “pool”, “job” no existen para él.
- **No bloquear la página esperando a Sony.** Snapshot o stale.
- **No cargar la biblioteca completa en el cliente.** 50 por página.
- **No pedir definiciones por usuario.** Globales.
- **No calcular Vault Points desde Sony.** Desde DB.
- **No usar cuentas ajenas o falsas.** Legal/ToS.

---

## 17. Conclusión

Con varias cuentas, CheevoVault puede pasar de “un NPSSO que da miedo” a un **pool elástico y transparente**:

- **2 cuentas** dan failover y margen para 100 registros/día.
- **3–5 cuentas** permiten 1.000 registros/día con sync completo en 1–2 días, o en horas si aceptas solo onboarding rápido + enriquecimiento.
- **La UX** no habla de cuentas ni de límites: habla de “tus trofeos ya están”, “estamos añadiendo horas”, “PSN está tardando”, “te avisamos”.
- **La optimización** no es solo repartir llamadas: es no hacerlas. Snapshots, delta sync, definiciones globales, score desde DB y bootstrap único son los que de verdad bajan el coste.

La regla final: **el pool multiplica la capacidad; la persistencia y la cola multiplican la tranquilidad. Sin las dos, más cuentas solo compran unos días.**
