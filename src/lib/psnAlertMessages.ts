import { formatDate } from '@/utils/dates'
import type { PsnAccountStatus, PsnPoolSummary } from '@/types/psnPool'

/**
 * Every Telegram text about the PSN pool (#178), in one place so the owner can tune the wording. In Spanish (the
 * owner reads them) and outside `T`: they go to the owner's chat, never to a user. Labels and numbers only: never
 * a token, an NPSSO, an e-mail or a user. Each message starts with the environment whose pool it is about.
 */

/** Which pool a message is about: production's, or pre's (read by production, docs/releases.md). */
export type PsnAlertEnv = 'PRO' | 'PRE'

const LANG = 'es'
const day = (ms: number) => formatDate(ms, LANG)
const number = (n: number) => n.toLocaleString(LANG)
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const STATUS: Record<PsnAccountStatus, string> = {
  active: 'activa',
  paused: 'pausada',
  draining: 'terminando lo que tiene',
  quarantined: 'en cuarentena',
}

/** The head of every message: which environment, then what. */
export function alertHeader(env: PsnAlertEnv): string {
  return `[${env}] CheevoVault, cuentas de PSN`
}

/** One message: the head, then each alert as its own paragraph. */
export function alertMessage(env: PsnAlertEnv, texts: string[]): string {
  return [alertHeader(env), ...texts].join('\n\n')
}

/** An NPSSO at 14, 7, 3 or 1 days, or gone (0). */
export function npssoExpiringText(label: string, daysLeft: number, expiresAt: number): string {
  if (daysLeft === 0) return `${label}: su inicio de sesión de PlayStation ha caducado. Renuévalo desde el panel de admin.`
  return `${label}: su inicio de sesión de PlayStation caduca en ${daysLeft} ${plural(daysLeft, 'día', 'días')} (${day(expiresAt)}). Renuévalo desde el panel de admin.`
}

/** The refresh token and the NPSSO were both refused: the account is out of the pool until renewed. */
export function quarantinedText(label: string): string {
  return `${label} está en cuarentena: Sony ha rechazado su inicio de sesión (ni el token de refresco ni el NPSSO sirven). Renuévalo o elimínalo desde el panel de admin.`
}

export function rateLimitedText(pct: number, calls: number): string {
  return `Sony ha rechazado por exceso de peticiones el ${number(pct)} % de las ${number(calls)} llamadas de la última hora.`
}

/** Fewer than two accounts can read Sony, out of the ones meant to be serving. */
export function poolLowText(usable: number, serving: number): string {
  return `Solo ${usable} de ${serving} cuentas ${plural(usable, 'puede', 'pueden')} leer Sony ahora mismo.`
}

export function syncFailuresText(failed: number, total: number): string {
  return `Han fallado ${number(failed)} de ${number(total)} sincronizaciones en la última hora.`
}

export type DigestAccount = { label: string; status: PsnAccountStatus; daysLeft: number | null; canaryOk: boolean | null }

function digestLine(a: DigestAccount): string {
  const left = a.daysLeft === null ? 'caducidad desconocida' : `${plural(a.daysLeft, 'queda', 'quedan')} ${a.daysLeft} ${plural(a.daysLeft, 'día', 'días')}`
  const canary = a.canaryOk === null ? 'sin canario aún' : a.canaryOk ? 'canario OK' : 'canario fallido'
  return `${a.label}: ${STATUS[a.status]}, ${left}, ${canary}`
}

/** The daily summary, after 09:00 UTC. */
export function digestText(p: PsnPoolSummary, accounts: DigestAccount[], now: number): string {
  const head =
    `Resumen del ${day(now)}: ${p.usable} de ${p.accounts} ${plural(p.accounts, 'cuenta disponible', 'cuentas disponibles')}, ` +
    `${p.cooling} en pausa por exceso de peticiones, ${p.quarantined} en cuarentena. ` +
    `${number(p.callsLastHour)} llamadas en la última hora, ${number(p.rateLimitedPct)} % rechazadas por exceso.`
  const next = p.suggestion ? [`Próxima renovación: ${p.suggestion.label}, el ${day(p.suggestion.at)}.`] : []
  return [head, ...accounts.map(digestLine), ...next].join('\n')
}
