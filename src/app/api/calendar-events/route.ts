import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni eventi calendario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const type = searchParams.get('type')

    const where: any = {}

    if (propertyId) {
      where.propertyId = propertyId
    }

    if (type) {
      where.type = type
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Errore nel recupero eventi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero eventi' },
      { status: 500 }
    )
  }
}

// POST - Crea evento calendario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, startDate, endDate, type, title, description } = body

    // Validazione
    if (!propertyId || !startDate || !endDate || !type) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    // Verifica che la data di fine sia dopo la data di inizio
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: 'La data di fine deve essere dopo la data di inizio' },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        propertyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        title: title || `${type === 'BLOCKED' ? 'Periodo bloccato' : 'Manutenzione'}`,
        description,
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione evento:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione evento' },
      { status: 500 }
    )
  }
}
