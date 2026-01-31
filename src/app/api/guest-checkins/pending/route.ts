import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Lista check-in in attesa di approvazione
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const pendingCheckIns = await prisma.guestCheckIn.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        selectedRoom: {
          include: {
            property: { select: { name: true, city: true } },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json(pendingCheckIns)
  } catch (error) {
    console.error('Errore nel recupero check-in pending:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero check-in' },
      { status: 500 }
    )
  }
}
