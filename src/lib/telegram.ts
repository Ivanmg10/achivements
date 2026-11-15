/**
 * Alerts to the owner over Telegram (#178), through the bot they already run for their own agent (Hermes).
 * **Send-only**: this app only ever calls `sendMessage`. It never calls `setWebhook`, `getUpdates` or
 * `deleteWebhook`: the bot's updates belong to Hermes, which polls them, and any of those would break it.
 *
 * Never put a secret in a message (no NPSSO, token, e-mail or user data): Telegram keeps the history.
 */
const API = 'https://api.telegram.org'
const TIMEOUT_MS = 8_000

export type TelegramResult = 'sent' | 'not-configured' | 'failed'

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim())
}

/** Telegram's HTML mode needs these three escaped; the text is sent as plain text in it. */
export function escapeTelegram(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Sends `text` to the owner's chat. Never throws: an alert that cannot be sent is logged, without the token. */
export async function sendTelegram(text: string): Promise<TelegramResult> {
  if (!telegramConfigured()) return 'not-configured'
  const token = process.env.TELEGRAM_BOT_TOKEN!.trim()
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID!.trim(),
        text: escapeTelegram(text),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return 'sent'
    console.error('[telegram] sendMessage answered', res.status)
    return 'failed'
  } catch (err) {
    console.error('[telegram] could not reach Telegram', err instanceof Error ? err.name : 'unknown')
    return 'failed'
  }
}
