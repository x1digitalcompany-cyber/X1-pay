import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const original = await prisma.product.findFirst({
    where: { id: params.id, userId },
    include: { checkouts: true },
  })
  if (!original) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const slug = `${generateSlug(original.name)}-copia-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      userId,
      name: `Cópia de ${original.name}`,
      description: original.description,
      category: original.category,
      type: original.type,
      unitCost: original.unitCost,
      logisticsId: original.logisticsId,
      imageUrl: original.imageUrl,
      isActive: false,
      checkouts: {
        create: {
          name: original.checkouts[0]?.name || original.name,
          slug,
          price: original.checkouts[0]?.price || 0,
          isActive: false,
        },
      },
    },
    include: { checkouts: true },
  })

  return NextResponse.json(product, { status: 201 })
}
