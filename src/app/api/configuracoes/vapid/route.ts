import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const keys = webpush.generateVAPIDKeys()

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey },
    update: { vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey },
  })

  return NextResponse.json({ publicKey: keys.publicKey })
}
