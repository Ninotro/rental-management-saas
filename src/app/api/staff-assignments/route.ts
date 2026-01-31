import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni lista assegnazioni
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (date) {
      const targetDate = new Date(date)
      where.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      }
    }

    if (status) {
      where.status = status
    }

    const assignments = await prisma.staffAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Errore nel recupero assegnazioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero assegnazioni' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova assegnazione
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, propertyId, roomId, date, taskType, notes } = body

    // Validazione
    if (!userId || !date || !taskType) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    const assignment = await prisma.staffAssignment.create({
      data: {
        userId,
        propertyId: propertyId || null,
        roomId: roomId || null,
        date: new Date(date),
        taskType,
        notes: notes || null,
        createdById: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione assegnazione:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione assegnazione' },
      { status: 500 }
    )
  }
}
