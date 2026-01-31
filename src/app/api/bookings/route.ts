import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { generateBookingCode } from '@/lib/bookingCode'

// GET - Ottieni lista prenotazioni
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          select: {
            name: true,
            city: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        checkIn: 'desc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Errore nel recupero prenotazioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero prenotazioni' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova prenotazione
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const {
      propertyId,
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status,
      channel,
      channelBookingId,
      notes,
    } = body

    // Validazione
    if (!propertyId || !roomId || !guestName || !guestEmail || !checkIn || !checkOut || !guests || !totalPrice) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati (inclusa la stanza)' },
        { status: 400 }
      )
    }

    // Genera un codice univoco per la prenotazione
    let bookingCode = generateBookingCode()
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      const existing = await prisma.booking.findUnique({
        where: { bookingCode },
      })

      if (!existing) {
        isUnique = true
      } else {
        bookingCode = generateBookingCode()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Impossibile generare un codice univoco. Riprova.' },
        { status: 500 }
      )
    }

    // Verifica disponibilità (check conflitti sulla stanza specifica)
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            checkIn: {
              lte: new Date(checkOut),
            },
            checkOut: {
              gte: new Date(checkIn),
            },
          },
        ],
      },
    })

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'La stanza non è disponibile per le date selezionate' },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        propertyId,
        roomId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: parseInt(guests),
        totalPrice: parseFloat(totalPrice),
        status: status || 'PENDING',
        channel: channel || 'DIRECT',
        channelBookingId,
        notes,
        createdById: session.user.id,
      },
      include: {
        property: true,
        room: true,
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Errore nella creazione prenotazione:', error)

    // Gestione errori Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Codice prenotazione duplicato. Riprova.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Errore nella creazione prenotazione',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
