import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni tutti i check-in completati
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate)
      }
    }

    const checkIns = await prisma.guestCheckIn.findMany({
      where,
      include: {
        booking: {
          include: {
            property: {
              select: {
                name: true,
                city: true,
                address: true,
              },
            },
            room: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json(checkIns)
  } catch (error) {
    console.error('Errore nel recupero check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero check-in' },
      { status: 500 }
    )
  }
}
