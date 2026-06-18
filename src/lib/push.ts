import webpush from 'web-push'
import { prisma } from './prisma'

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings?.vapidPublicKey || !settings?.vapidPrivateKey) return

  webpush.setVapidDetails(
    'mailto:admin@x1pay.com',
    settings.vapidPublicKey,
    settings.vapidPrivateKey
  )

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
        })
    )
  )
}
