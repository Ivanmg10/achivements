# PSN service accounts: 20 NPSSO, automatización, refresh y alertas Telegram

**Fecha:** 23 de octubre de 2026
**Pregunta:** “Tengo 3 cuentas PSN funcionales. ¿Puedo llegar a 20? ¿Cómo automatizo el alta, el refresh y los avisos? ¿Un bot de Telegram?”
**Respuesta corta:** sí puedes montar un pool de 20, pero **no puedes automatizar el login de Sony ni la obtención del NPSSO** (captcha/2FA y términos). Lo que sí se automatiza es todo lo demás: validación, tokens, salud, failover, rotación, capacidad y avisos. Con 20 cuentas, el trabajo manual real es **renovar ~10 NPSSO al mes** (una cada 3 días si están escalonadas); Telegram lo hace llevadero, no desaparece.

---

## 1. Reality check antes de crear 20 cuentas

- **No crees cuentas falsas ni automatices el login de Sony.** Usa cuentas que controles. Sony puede banear cuentas usadas para scraping masivo; revisa sus términos.
- **20 cuentas no son 20× si el límite es por IP.** Si el 429 aparece en todas a la vez, el pool no escala. Mide primero.
- **Cada cuenta caduca a los 60 días desde el login.** No se extiende con refresh. Renovar 20 cuentas es una operación recurrente.
- **Cada cuenta es un secreto vivo.** 20 NPSSO = 20 sesiones que pueden dar acceso a una cuenta PSN. Cifrado, auditoría y mínimo privilegio.
- **Empieza por 3–5, no por 20.** Con 3 funcionales + 2 nuevas tienes failover y margen. Sube a 10/20 solo si la cola lo pide.
- **A 20 cuentas, valora un acuerdo oficial/partner con Sony.** Es más sostenible que 20 sesiones personales.

---

## 2. Cómo lo tienes hoy en el proyecto

### 2.1 Credenciales

`src/lib/psnCredentials.ts` + `migrations/026_psn_credentials.sql`:

- Una sola fila: `psn_credentials` con `id = 1`.
- Guarda `npsso`, `refresh_token`, `access_token`, fechas de caducidad y `warned_at`.
- Secretos cifrados con `secretBox` (AES-256-GCM, clave derivada de `NEXTAUTH_SECRET`).
- `loadPsnCredentials`, `savePsnTokens`, `savePsnNpsso`, `npssoExpiry`, `daysLeft`.

### 2.2 Tokens

`src/lib/psnClient.ts`:

- `newTokens()`: usa el access token guardado; si caduca, refresh token; si falla, exchange del NPSSO.
- `pending` en memoria por instancia; **no hay lock en DB** entre instancias.
- `authorization()` cachea un solo token global.
- `psnCall()` reintenta una vez a los 2 s si Sony dice “too many requests”.

### 2.3 Cron y admin

- `vercel.json`: `/api/cron/psnToken` a las 09:00.
- `src/app/api/cron/psnToken/route.ts`: avisa por email a los admins 7 días antes; repite cada 2 días; `markPsnWarned`.
- `src/app/api/admin/psn/route.ts`:
  - `GET`: estado, días restantes, `updatedBy`.
  - `PUT`: valida NPSSO de 64 caracteres, `npssoExpiry`, `verifyNpsso`, guarda, `forgetPsnTokens`, `logAdminAction`.
- `AdminPsnToken.tsx`: una tarjeta con días restantes y un input para pegar el NPSSO.

### 2.4 Conclusión del estado actual

Está bien para **una** cuenta. Para 20 faltan:

- tabla de cuentas,
- router/pool,
- refresh por cuenta,
- locks,
- salud/cooldown,
- admin de varias cuentas,
- avisos por cuenta,
- Telegram.

---

## 3. Qué se puede automatizar y qué no

| Tarea | ¿Automático? | Cómo |
|---|---|---|
| Crear una cuenta PSN | **No** | Registro manual; captcha/términos |
| Iniciar sesión en Sony | **No** | Captcha/2FA; no automatizar |
| Obtener el NPSSO | **No** | Copiar la cookie tras login manual |
| Validar el NPSSO | **Sí** | `npssoExpiry` + exchange + canary |
| Guardar/cifrar | **Sí** | `secretBox` |
| Refresh del access token | **Sí** | Cron con lock por cuenta |
| Refresh del refresh token | **Sí, limitado** | Refresh; si falla, NPSSO |
| Renovar el NPSSO (60 días) | **No** | Login manual + pegar en admin |
| Detectar caducidad | **Sí** | `npsso_expires_at` |
| Avisar por Telegram | **Sí** | Bot API |
| Failover entre cuentas | **Sí** | Pool/router |
| Rotar una cuenta | **Parcial** | Pegar NPSSO; el resto automático |
| Medir 429/latencia | **Sí** | Stats por cuenta |
| Escalar a más cuentas | **Sí, manual** | Añadir cuenta y validar |

La frase clave: **automatizas la operación, no la identidad**. El único paso humano obligatorio es renovar el NPSSO cada 60 días.

---

## 4. Modelo para 20 cuentas

Usa el esquema de `docs/psn-multi-account-pool.md`:

- `psn_service_accounts`: una fila por cuenta, secretos cifrados, estado, peso, concurrencia, rate, cooldown, última salud.
- `psn_account_leases`: slots de concurrencia.
- `psn_account_budget`: token bucket por cuenta.
- `psn_account_stats`: calls/429/p95 por minuto.
- `psn_sync_jobs`: trabajos con prioridad/fase.

Reglas para 20:

- **20 × 2 slots = 40 llamadas concurrentes** como máximo.
- **20 × 40/min = 800/min nominal**; al 70 %, **560/min ≈ 806.000/día**.
- Una cuenta no debe pasar del 70 % de su rate.
- Reparte pesos: cuentas más antiguas/fiables con peso 2; nuevas con peso 1.
- Reserva 1–2 cuentas como “calientes” de bajo peso, no frías.
- No uses las 20 al 100 %: el margen es lo que evita 429 en picos.

Capacidad aproximada de 20 cuentas (70 %):

| Trabajo | Llamadas | Capacidad/día |
|---|---:|---:|
| Onboarding core + recientes | 50 | ~16.000 enlaces/día |
| + historial 100 juegos | 250 | ~3.200 enlaces/día |
| + historial 300 juegos | 650 | ~1.240 enlaces/día |
| Activos con refresh delta | 20 | ~40.000 activos/día |
| Mezcla 10k activos + 5k enlaces | 200k + 250k | ~450k/806k (56 %) |

A 20 cuentas el problema deja de ser capacidad y pasa a ser **operación**: 20 caducidades, 20 secretos, 20 posibles baneos.

---

## 5. Ciclo de vida de una cuenta y refresh

```
Alta manual (NPSSO)
   │
   ▼
Validar + canary + cifrar
   │
   ▼
active ── access token 1 h ── refresh automático cada ~50 min
   │
   ├── refresh token 10 días ── refresh; si falla, NPSSO
   │
   ├── NPSSO 60 días ── renovación manual (Telegram avisa)
   │
   ├── 429 ── cooldown exponencial + jitter; vuelve solo
   │
   └── 401/ban ── quarantined; aviso; rotar o retirar
```

### 5.1 Refresh del access token

- Cron cada 5–10 min.
- Por cuenta: si `access_expires_at - now < 10 min`, refrescar.
- `SELECT ... FOR UPDATE` sobre la fila de la cuenta para que dos instancias no refresquen a la vez.
- Guardar tokens; actualizar `last_refresh_at`.
- Si falla: probar refresh token; si falla, exchange del NPSSO; si falla, cuarentena.
- No refrescar las 20 a la vez: añade jitter y procesa en lotes de 2–3.

### 5.2 Refresh token

- Dura 10 días (según el comportamiento actual; refrescar no lo extiende).
- A los ~7 días, refrescar proactivamente.
- Si el refresh token muere pero el NPSSO sigue vivo, hacer un exchange nuevo del NPSSO.
- Si el NPSSO también murió, cuarentena y aviso.

### 5.3 NPSSO (60 días)

- **No se puede extender.** Solo un login manual produce uno nuevo.
- Programa `renew_at = npsso_expires_at - 14 días`.
- Avisos Telegram a 14/7/3/1 días.
- Admin pega el nuevo NPSSO; el sistema valida, hace canary y vuelve a `active`.
- Escalona las fechas: con 20 cuentas, una renovación cada 3 días. Si todas caducan el mismo día, es un incidente.

### 5.4 Rotación escalonada

- Al añadir 20, no las crees/renueves todas el mismo día.
- Si ya existen y caducan juntas, re-loguea una cada 3 días durante 60 días para repartir.
- Mantén una tabla/calendario con `label`, `expires_at`, `renew_at`, `owner`.
- Telegram puede enviar el calendario semanal.

---

## 6. Alta de 20 cuentas: flujo práctico

1. Crea/usa una cuenta PSN dedicada, con correo propio, sin compras ni datos personales.
2. Inicia sesión en `playstation.com` en un navegador privado.
3. Abre `https://ca.account.sony.com/api/v1/ssocookie` y copia `npsso`.
4. En **Admin → PSN Accounts → Add account**:
   - etiqueta (`PSN-04`),
   - NPSSO,
   - peso (1–2),
   - concurrencia (2),
   - rate (40/min).
5. El servidor valida, intercambia tokens, hace canary a su propio perfil y guarda cifrado.
6. Repite **una cuenta cada 2–3 días**, no 17 en una tarde.
7. Anota la caducidad; Telegram la recordará.

**No** subas un CSV con 20 NPSSO por chat/email. **No** pegues NPSSO en Telegram: queda en el historial. El bot solo manda enlaces al admin.

---

## 7. Bot de Telegram

### 7.1 Qué debe hacer

- **Avisos:**
  - NPSSO caduca en 14/7/3/1 días (por cuenta).
  - Refresh falló / cuenta en cuarentena.
  - 429 alto o cuenta en cooldown.
  - Menos de 2 cuentas activas.
  - Cola p95 > 15 min.
  - Fallos de sync > 5 %.
  - Resumen diario 09:00.
- **Comandos (opcional):**
  - `/status` → pool: activas, cooldown, cola, 429, capacidad.
  - `/accounts` → etiquetas, días restantes, estado; **nunca tokens**.
  - `/queue` → profundidad y ETA.
  - `/help`.
  - `/admin` → enlace al panel.
- **No debe hacer:**
  - Recibir NPSSO por chat.
  - Mostrar tokens.
  - Ejecutar acciones destructivas sin confirmación.
  - Automatizar el login de Sony.

### 7.2 Configuración

1. Habla con **@BotFather** → `/newbot` → token.
2. Añade el bot a un grupo privado o habla con él; obtén `chat_id` (con `getUpdates` o un helper).
3. Variables:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_SECRET=una-cadena-larga
TELEGRAM_ADMIN_IDS=123456789,987654321
```

4. Para alertas basta con el token y el chat; para comandos, configura el webhook:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://www.cheevovault.com/api/telegram/webhook&secret_token=<SECRET>
```

### 7.3 Código

`src/lib/telegram.ts`:

```ts
const API = 'https://api.telegram.org'

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegram(text: string, opts: { disablePreview?: boolean } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return 'not-configured'
  const res = await fetch(`${API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: escapeHtml(text),
      parse_mode: 'HTML',
      disable_web_page_preview: opts.disablePreview ?? true,
    }),
  })
  return res.ok ? 'sent' : `failed:${res.status}`
}
```

`src/app/api/cron/psn-alerts/route.ts`:

- `CRON_SECRET`.
- Carga cuentas y cola.
- Construye **un solo digest** (no 20 mensajes).
- Deduplica con `psn_alert_state(kind, account_id, last_sent_at)`.
- Envía por `sendTelegram`; si no está configurado, cae al email actual.
- Programa: cada 15 min para urgente; 09:00 para resumen.

`psn_alert_state`:

```sql
CREATE TABLE IF NOT EXISTS psn_alert_state (
  kind        TEXT NOT NULL,
  account_id  INTEGER,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, account_id)
);
```

`src/app/api/telegram/webhook/route.ts`:

- Verifica `X-Telegram-Bot-Api-Secret-Token`.
- Solo `TELEGRAM_ADMIN_IDS`/`TELEGRAM_CHAT_ID`.
- Responde `/status`, `/accounts`, `/queue`.
- No acepta secretos.
- Rate limit por chat.

### 7.4 Formato de mensajes

```
🟢 PSN pool — 23 oct 09:00
Activas: 18/20 · Cooldown: 1 · Cuarentena: 1
Cola: 12 jobs · p95: 4 min · 429: 0.4 %
Capacidad: 504/min (70 %)
Próximas caducidades:
• PSN-04 en 3 días
• PSN-11 en 6 días
[Open admin] [Mute 1h]
```

Nada de tokens, IDs de cuenta Sony ni emails.

---

## 8. Admin para 20 cuentas

- Tabla con: etiqueta, estado, días para caducar, rate, concurrencia, 429 %, p95, última usada.
- Acciones: Add, Test, Pause, Drain, Rotate, Remove.
- “Rotate” pide el NPSSO y valida antes de reemplazar.
- “Drain” termina los jobs actuales y sale de rotación.
- “Test” hace canary al propio perfil.
- “Export CSV” solo con etiqueta/estado/fechas, sin secretos.
- Vista de calendario de renovaciones.
- Auditoría con `logAdminAction`.

No metas 20 formularios en una sola tarjeta; usa una tabla y un modal de alta.

---

## 9. Capacidad de 20 cuentas

| Concepto | Valor |
|---|---:|
| Rate nominal | 20 × 40 = 800/min |
| Rate efectivo (70 %) | 560/min |
| Llamadas/día | ~806.000 |
| Slots concurrentes | 20 × 2 = 40 |
| Renovaciones NPSSO | ~10/mes (una cada 3 días) |
| Refresh access token | ~20/hora, automático |
| Refresh token | 20 cada 10 días, automático |
| Canary | 20 cada 30 min = 960/día |

Con 20 cuentas puedes servir aproximadamente:

- **3.200 enlaces/día** con historial de 100 juegos, o
- **16.000 enlaces/día** solo core + recientes, o
- **40.000 activos/día** con refresh delta, o
- una mezcla como **10.000 activos + 5.000 enlaces** (56 % de capacidad).

Pero el coste operativo es real: 20 secretos, 20 caducidades, 20 posibles baneos, y un ToS que no está pensado para esto.

---

## 10. Plan de adopción

### Fase A — 3 cuentas

- Pool mínimo con salud/cooldown.
- Refresh por cuenta con lock.
- Telegram básico (caducidad + pool down).
- Admin de 3 cuentas.
- Medir 429 y si el límite es por cuenta o IP.

### Fase B — 5–8 cuentas

- Añadir una cada 2–3 días.
- Worker dedicado; cola; snapshots.
- Digest diario; rotación escalonada.
- Capacidad para 25k–50k usuarios totales según DAU.

### Fase C — 10–20 cuentas

- Solo si la cola p95 lo pide.
- Dashboard completo; alertas; runbook.
- Revisión legal/partner.
- Capacidad para 50k–100k usuarios según DAU/profundidad.

**No saltes a 20 de golpe.** El coste de operar 20 cuentas sin pool/cola es mayor que el de optimizar el sync.

---

## 11. Seguridad

- Cifra NPSSO/tokens con una clave dedicada (`PSN_SECRET_KEY`), no con `NEXTAUTH_SECRET`; versiona la clave.
- No loguees tokens; no los pongas en URLs ni en Telegram.
- Admin con segunda contraseña; auditoría de cada alta/rotación.
- Limita el webhook de Telegram por secreto y por chat ID.
- Borra secretos al retirar una cuenta; conserva solo metadatos.
- 2FA en las cuentas si es compatible con la extracción del NPSSO; si no, contraseña única y correo dedicado.
- No compartas las cuentas de servicio con usuarios.

---

## 12. Checklist

- [ ] Medir si el 429 es por cuenta o por IP.
- [ ] Migrar `psn_credentials` a `psn_service_accounts`.
- [ ] Pool con leases, budgets, health y cooldown.
- [ ] Refresh por cuenta con `FOR UPDATE`.
- [ ] Canary por cuenta.
- [ ] Admin de varias cuentas.
- [ ] Telegram: token, chat, secreto, alertas, comandos.
- [ ] Calendario de renovaciones escalonado.
- [ ] Runbook: 401, 429, todas caídas, rotación.
- [ ] Revisión legal/ToS antes de 10+ cuentas.

**Resumen:** 20 cuentas te dan capacidad de sobra, pero no te dan automatización del login de Sony. Lo automatizable es el pool, los tokens, la salud, la rotación y los avisos. Telegram es una buena pieza para que 20 caducidades no se te escapen; el NPSSO se sigue pegando a mano cada 60 días.
