import {
  alertMessage,
  digestText,
  npssoExpiringText,
  poolLowText,
  quarantinedText,
  queueSlowText,
  rateLimitedText,
  readsSlowText,
  syncFailuresText,
} from './psnAlertMessages'
import { DAY_MS, NOW, psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

// The literal texts the owner reads on Telegram; change the wording here and in psnAlertMessages.ts together.
const DEC_12 = Date.UTC(2026, 11, 12, 12)

test('every message says first which environment it is about', () => {
  expect(alertMessage('PRO', ['a', 'b'])).toBe('[PRO] CheevoVault, cuentas de PSN\n\na\n\nb')
  expect(alertMessage('PRE', ['a'])).toBe('[PRE] CheevoVault, cuentas de PSN\n\na')
})

test('an NPSSO about to die, at 14, 7, 3 and 1 days, and gone', () => {
  expect(npssoExpiringText('PSN-2', 14, DEC_12)).toBe('PSN-2: su inicio de sesión de PlayStation caduca en 14 días (12 dic). Renuévalo desde el panel de admin.')
  expect(npssoExpiringText('PSN-2', 7, DEC_12)).toBe('PSN-2: su inicio de sesión de PlayStation caduca en 7 días (12 dic). Renuévalo desde el panel de admin.')
  expect(npssoExpiringText('PSN-2', 3, DEC_12)).toBe('PSN-2: su inicio de sesión de PlayStation caduca en 3 días (12 dic). Renuévalo desde el panel de admin.')
  expect(npssoExpiringText('PSN-2', 1, DEC_12)).toBe('PSN-2: su inicio de sesión de PlayStation caduca en 1 día (12 dic). Renuévalo desde el panel de admin.')
  expect(npssoExpiringText('PSN-2', 0, DEC_12)).toBe('PSN-2: su inicio de sesión de PlayStation ha caducado. Renuévalo desde el panel de admin.')
})

test('a quarantined account (its refresh and its NPSSO refused)', () => {
  expect(quarantinedText('PSN-3')).toBe(
    'PSN-3 está en cuarentena: Sony ha rechazado su inicio de sesión (ni el token de refresco ni el NPSSO sirven). Renuévalo o elimínalo desde el panel de admin.',
  )
})

test('too many 429s, with the number in Spanish', () => {
  expect(rateLimitedText(8.5, 1240)).toBe('Sony ha rechazado por exceso de peticiones el 8,5 % de las 1240 llamadas de los últimos 5 minutos.')
})

test('a slow queue and slow page reads (#180)', () => {
  expect(queueSlowText(20 * 60_000, 12)).toBe(
    'La cola de sincronización va con retraso: el 95 % de los trabajos empieza en menos de 20 min, y hay 12 esperando. Si no baja, mira el runbook (docs/platforms/psn.md).',
  )
  expect(readsSlowText(1450, 300)).toBe('Las páginas de PSN van lentas: el 95 % de las 300 lecturas de los últimos 15 minutos tardó menos de 1450 ms, por encima de 1 s.')
})

test('fewer than two usable accounts', () => {
  expect(poolLowText(1, 3)).toBe('Solo 1 de 3 cuentas puede leer Sony ahora mismo.')
  expect(poolLowText(0, 2)).toBe('Solo 0 de 2 cuentas pueden leer Sony ahora mismo.')
})

test('failing syncs', () => {
  expect(syncFailuresText(7, 40)).toBe('Han fallado 7 de 40 sincronizaciones en la última hora.')
})

test('the daily digest: the pool, a line per account, the next renewal', () => {
  const status = psnStatus([
    psnAccount({ callsLastHour: 400, rateLimitedLastHour: 1, npssoExpiresAt: NOW + 45 * DAY_MS + 1000 }),
    psnAccount({ id: 2, label: 'PSN-2', status: 'quarantined', npssoExpiresAt: NOW + DAY_MS + 1000, canaryOk: false }),
    psnAccount({ id: 3, label: 'PSN-3', canaryAt: null, canaryOk: null, npssoExpiresAt: null }),
  ])
  const lines = status.accounts.map((a) => ({ label: a.label, status: a.status, daysLeft: a.npssoExpiresAt === null ? null : Math.floor((a.npssoExpiresAt - NOW) / DAY_MS), canaryOk: a.canaryOk }))
  expect(digestText(status.pool, lines, NOW)).toBe(
    [
      'Resumen del 15 nov: 2 de 3 cuentas disponibles, 0 en pausa por exceso de peticiones, 1 en cuarentena. 400 llamadas en la última hora, 0,3 % rechazadas por exceso.',
      'PSN-1: activa, quedan 45 días, canario OK',
      'PSN-2: en cuarentena, queda 1 día, canario fallido',
      'PSN-3: activa, caducidad desconocida, sin canario aún',
      'Próxima renovación: PSN-2, el 15 nov.',
    ].join('\n'),
  )
})
