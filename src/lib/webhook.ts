import { prisma } from './prisma'

export async function dispatchWebhook(userId: string, event: string, payload: object) {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings?.webhookUrl) return

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() })

  try {
    const res = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(10000),
    })

    const log = JSON.parse(settings.webhookLog ?? '[]') as Array<{
      event: string
      status: number
      date: string
    }>
    log.unshift({ event, status: res.status, date: new Date().toISOString() })
    await prisma.settings.update({
      where: { userId },
      data: { webhookLog: JSON.stringify(log.slice(0, 10)) },
    })
  } catch (err) {
    console.error('Webhook dispatch failed:', err)
  }
}
