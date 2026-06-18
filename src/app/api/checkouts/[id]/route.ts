import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const checkout = await prisma.checkout.findFirst({
    where: { id: params.id, product: { userId } },
    include: {
      product: {
        include: {
          user: { include: { settings: true } },
        },
      },
    },
  })

  if (!checkout) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(checkout)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const existing = await prisma.checkout.findFirst({
    where: { id: params.id, product: { userId } },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await prisma.checkout.update({
    where: { id: params.id },
    data: {
      name: body.name,
      slug: body.slug,
      price: body.price,
      isActive: body.isActive,
      supplierCost: body.supplierCost ?? 0,
      shippingCost: body.shippingCost ?? 0,
      maxInstallments: body.maxInstallments ?? 12,
      installmentMode: body.installmentMode ?? 'table',
      showTotalPrice: body.showTotalPrice ?? true,
      allowPix: body.allowPix ?? true,
      allowCard: body.allowCard ?? true,
      allowBoleto: body.allowBoleto ?? true,
      badge: body.badge ?? null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.checkout.deleteMany({
    where: { id: params.id, product: { userId } },
  })

  return NextResponse.json({ success: true })
}
