# PSN a escala: de 1.000 a 100.000 usuarios

**Fecha:** 23 de octubre de 2026
**Pregunta:** si CheevoVault explota y pasa por 1.000, 5.000, 10.000, 50.000 y 100.000 usuarios, ¿cómo se adapta la parte de PSN?
**Idea clave:** el número de usuarios registrados no consume NPSSO. Consumen **usuarios activos que sincronizan** y **enlaces nuevos**. Las visitas a perfiles se sirven de Postgres; no tocan Sony.

---

## 0. La fórmula

```
capacidad_por_cuenta ≈ 40 llamadas/min × 0,7 × 1.440 min = 40.320 llamadas/día
cuentas ≈ (DAU × llamadas_refresh + enlaces_nuevos × coste_nuevo + backfill) / 32.000
```

- 40/min es el techo conservador actual de CheevoVault; el 0,7 deja margen.
- 32.000 es la capacidad útil por cuenta con ~20 % de headroom.
- `llamadas_refresh` ≈ 20/día con delta sync (4 refrescos × ~4 llamadas + juegos movidos).
- `coste_nuevo` ≈ 50 (core + 20 recientes); con historial de 100 juegos, ~250; con 300, ~650.
- Si el 429 es por IP y no por cuenta, el pool no multiplica. Medirlo antes de comprar más cuentas.

Supuestos de la tabla:

- 50 % de los registros enlazan PSN.
- Nuevos enlaces/día = 0,5 % del total (1 % de registros nuevos × 50 % PSN).
- DAU = 10 %, 20 % o 30 % del total.
- Historial en cola; el coste nuevo es 50. Si se exige historial completo, suma aparte.

---

## 1. Cuántas cuentas hacen falta

| Usuarios totales | Nuevos enlaces/día | DAU 10 % | DAU 20 % | DAU 30 % |
|---:|---:|---:|---:|---:|
| 1.000 | 5 | 1 | 1 | 1 |
| 5.000 | 25 | 1 | 1 | 1 |
| 10.000 | 50 | 1 | 2 | 2 |
| 50.000 | 250 | 4 | 7 | 10 |
| 100.000 | 500 | 7 | 14 | 20 |

Con historial completo de 100 juegos (~250 por nuevo), las cuentas suben:

| Usuarios totales | DAU 10 % | DAU 20 % | DAU 30 % |
|---:|---:|---:|---:|
| 10.000 | 2 | 2 | 3 |
| 50.000 | 6 | 9 | 12 |
| 100.000 | 11 | 18 | 24 |

Lectura:

- **1.000–5.000 usuarios:** 1 cuenta basta por capacidad; ten 2 por failover.
- **10.000:** 2–3 cuentas; el límite real empieza a ser la base de datos y la cola, no Sony.
- **50.000:** 4–12 cuentas según DAU y profundidad; aquí ya hace falta un worker dedicado y particiones.
- **100.000:** 7–25 cuentas; el rango es enorme porque depende de DAU y de si cada nuevo recibe historial completo. A este nivel, el pool de cuentas es también un riesgo operativo y legal: hay que buscar acuerdo oficial/partner o limitar profundidad.

Si el límite real de Sony es 20/min por cuenta, duplica las cuentas; si es 60/min, redúcelas ~33 %.

---

## 2. Etapas

### 2.1 1.000 usuarios — “no rompas lo que funciona”

**Qué hay:** Next.js + Postgres + cron + 1 NPSSO.
**Qué añadir:**

- Verificación PSN (About Me).
- Snapshots + cola + `psnTitlesCore`.
- 1 cuenta principal + 1 reserva.
- CDN para imágenes; cache de definiciones.

**Qué vigilar:** corrección, no escala. 100–300 DAU y 5–10 enlaces/día no justifican infraestructura nueva.

**Coste:** el actual.

---

### 2.2 5.000 usuarios — “saca el sync de la request”

**Qué hay:** 500–1.500 DAU; 25 enlaces/día.
**Qué añadir:**

- 2 cuentas (principal + failover), pool con salud/cooldown.
- Worker dedicado (contenedor pequeño) o cron cada minuto; no sync en la request.
- Postgres con índices y pooler (Neon pooler/PgBouncer).
- Cache de definiciones global; negativa/stale.
- CDN de imágenes y páginas públicas.

**Qué rompe si no:** picos de caché, cron solapado, conexiones a DB, egress de imágenes.

---

### 2.3 10.000 usuarios — “empieza a doler la base de datos”

**Qué hay:** 1.000–3.000 DAU; 50 enlaces/día.
**Qué añadir:**

- 2–3 cuentas activas + 1 reserva.
- Servicio de sync separado del web (Fly/Render/Railway/ECS), autoscaling básico.
- Réplica de lectura para perfiles/rankings/público.
- Partición de `psn_player_trophies` si supera ~20–50 M filas.
- Rankings precomputados (no `SUM`/`COUNT` sobre millones en cada visita).
- Redis para caché/rate limit si Postgres empieza a tener contención; aún se puede vivir sin él.
- Búsqueda: Postgres FTS o Meilisearch/Typesense si el buscador crece.

**Qué rompe si no:** cron largo, cola atascada, CPU de DB, consultas de ranking, timeouts de funciones.

---

### 2.4 50.000 usuarios — “varios sistemas, no un monolito”

**Qué hay:** 5.000–15.000 DAU; 250 enlaces/día.
**Qué añadir:**

- 4–12 cuentas según DAU/profundidad.
- 10–20 workers; cola Redis/BullMQ o SQS (Postgres `SKIP LOCKED` empieza a quedarse corto).
- Postgres primary + 1–2 réplicas; particiones por hash de `user_id` o por mes; archive a almacenamiento frío.
- Leaderboards y stats en tablas incrementales/materialized views; nada de agregar en vivo sobre todo el histórico.
- CDN/ISR agresivo para páginas públicas; los crawlers no tocan la DB.
- Búsqueda dedicada; imágenes en object storage/CDN.
- Observabilidad real: OpenTelemetry/Sentry/Grafana, SLOs, on-call, runbooks.
- Revisión legal: 10+ cuentas de servicio y ToS de Sony; plan de partner.

**Qué rompe si no:** el primary de Postgres, el cron, la cola, el coste de egress y el soporte manual.

---

### 2.5 100.000 usuarios — “producto y plataforma”

**Qué hay:** 10.000–30.000 DAU; 500 enlaces/día; 7–25 cuentas o partner.
**Qué añadir:**

- Servicio de sync dedicado, autoscaled, multi-worker, con cuotas por cuenta y por usuario.
- Cola event-driven (SQS/Kafka/Redis Streams), idempotencia, DLQ, reintentos, prioridades.
- Postgres shardeado por `user_id` (Citus o sharding de aplicación) o base distribuida; OLTP separado de analítica.
- Réplicas multi-región para lectura; CDN global; una región de escritura.
- Data lake/warehouse para históricos, cohortes y analítica; retención por capas (caliente 90 días, frío S3/Parquet).
- Rankings y stats precomputados por período; solo top N en vivo.
- Equipo/ops: on-call, incident response, backups/PITR, DR probado, soporte, moderación.
- Acuerdo con Sony/partner o una estrategia de datos que no dependa de 20 cuentas frágiles.

**Qué rompe si no:** una sola DB/región, el pool de cuentas, el soporte, la factura y el riesgo legal.

---

## 3. Qué cambia en cada capa

### 3.1 Base de datos

| Etapa | DB |
|---|---|
| 1k–5k | Un Postgres; índices; pooler |
| 10k | Réplica de lectura; partición de trofeos si hace falta |
| 50k | Primary + réplicas; particiones; archivado; stats precomputadas |
| 100k | Sharding/Citus o distribuida; OLTP + analítica separadas; data lake |

Estimación tosca para 100k usuarios:

- `psn_player_games`: 100k × 500 = **50 M filas**.
- `psn_player_trophies`: 100k × 2.000–5.000 = **200–500 M filas**.
- `score_games`: 100k × 500 = **50 M filas**.
- `psn_games` ~250k; `psn_trophies` ~10–15 M.

No se puede tener `psn_player_trophies` sin particionar y pretender hacer `COUNT(*)` por visita. Se guardan agregados en `psn_player_games` y se consulta por usuario.

### 3.2 Cola y workers

| Etapa | Cola | Workers |
|---|---|---|
| 1k–5k | Postgres `SKIP LOCKED` | Cron/1 contenedor |
| 10k | Postgres o Redis | 2–5 |
| 50k | Redis/BullMQ o SQS | 10–20, autoscaling |
| 100k | SQS/Kafka/Redis Streams + DLQ | 30–50, autoscaling, multi-AZ |

### 3.3 Lecturas y SEO

- Perfiles y juegos públicos: ISR/SSR + CDN; `s-maxage=60`, `stale-while-revalidate`.
- Privados: `private`, `Vary: Cookie`.
- Imágenes: object storage/CDN, no Sony en la request.
- Sitemaps por tipo; no indexar perfiles privados.
- Búsqueda: índice dedicado a partir de 10k–50k.

### 3.4 Rankings

- Nunca `SUM`/`COUNT` sobre todo el histórico en vivo.
- `user_totals`, `leaderboard_*`, `game_leaderboard_*` actualizados por el worker.
- Snapshots semanales; top N cacheado; paginación.
- Per-game leaderboards precomputados.

### 3.5 Cuentas NPSSO

- Pool stateless; cualquier cuenta lee cualquier perfil público.
- Cuotas por cuenta y por usuario; health/cooldown; leases.
- Renovaciones escalonadas: con 20 cuentas, una cada 3 días; con 5, una cada 12 días.
- A partir de 10–15 cuentas, el riesgo de ToS y la operación pesan más que la capacidad; buscar partner/oficial.

---

## 4. Señales para pasar de etapa

- **Cuenta:** utilización > 70 % 1 h, 429 > 1 %, cola p95 > 5 min.
- **Worker:** cron > 50 s, cola p95 > 15 min, jobs `running` vencidos.
- **DB:** CPU > 60 %, p95 > 500 ms, conexiones > 70 %, tabla > 50 M filas.
- **Web:** p95 de bootstrap > 500 ms, cache hit < 80 %, egress alto.
- **Rankings:** consultas > 200 ms o escaneos de tablas grandes.
- **Operación:** incidentes manuales > 1/semana, soporte desbordado.

No añadas infraestructura “por si acaso”; añádela cuando una señal se sostiene.

---

## 5. Qué no hacer

- No añadir NPSSO para arreglar páginas lentas: primero persiste y sirve de DB.
- No meter sync en la request del usuario.
- No ejecutar jobs largos en funciones serverless a volumen alto.
- No hacer `COUNT(*)`/`SUM` sobre millones en cada visita.
- No tener `psn_player_trophies` sin particionar a 100k.
- No depender de una sola región/DB.
- No crear cuentas falsas ni automatizar el login de Sony.
- No ignorar ToS/legal cuando el pool crece.

---

## 6. Resumen por etapa

| Usuarios | DAU típico | Enlaces/día | Cuentas | Infra |
|---:|---:|---:|---:|---|
| 1.000 | 100–300 | 5 | 1–2 | Monolito + Postgres + cron |
| 5.000 | 500–1.500 | 25 | 2 | Worker + pool + CDN |
| 10.000 | 1.000–3.000 | 50 | 2–3 | Worker service + réplica + particiones |
| 50.000 | 5.000–15.000 | 250 | 4–12 | Redis/SQS + réplicas + sharding/particiones + on-call |
| 100.000 | 10.000–30.000 | 500 | 7–25 o partner | Event-driven + DB distribuida + multi-región + equipo |

La frase que resume todo: **a 1k el problema es el código; a 10k, la cola y la DB; a 50k, la arquitectura; a 100k, el equipo, el coste y Sony.**
