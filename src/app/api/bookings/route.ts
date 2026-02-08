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
            id: true,
            name: true,
            city: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        bookingRooms: {
          include: {
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        sentMessages: {
          select: {
            id: true,
            status: true,
            channel: true,
            sentAt: true,
          },
          orderBy: {
            createdAt: 'desc',
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
      roomId,      // Singola stanza (legacy/retrocompatibilità)
      roomIds,     // Array di stanze (nuovo sistema multi-stanza)
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

    // Normalizza roomIds: usa roomIds se fornito, altrimenti crea array da roomId singolo
    const selectedRoomIds: string[] = roomIds && roomIds.length > 0
      ? roomIds
      : (roomId ? [roomId] : [])

    // Validazione minima - solo propertyId è richiesto
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Seleziona almeno una struttura' },
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

    // Verifica disponibilità per tutte le stanze selezionate
    // Nota: il giorno del checkout è libero per un nuovo checkin (checkout mattina, checkin pomeriggio)
    if (selectedRoomIds.length > 0 && checkIn && checkOut) {
      // Cerca conflitti per prenotazioni con roomId singolo (legacy)
      const legacyConflicts = await prisma.booking.findMany({
        where: {
          roomId: { in: selectedRoomIds },
          status: { not: 'CANCELLED' },
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
        include: { room: true },
      })

      // Cerca conflitti nella tabella BookingRoom (nuove prenotazioni multi-stanza)
      const multiRoomConflicts = await prisma.bookingRoom.findMany({
        where: {
          roomId: { in: selectedRoomIds },
          booking: {
            status: { not: 'CANCELLED' },
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) },
          },
        },
        include: {
          room: true,
          booking: true,
        },
      })

      const allConflicts = [
        ...legacyConflicts.map(b => b.room?.name || 'Stanza'),
        ...multiRoomConflicts.map(br => br.room?.name || 'Stanza'),
      ]

      if (allConflicts.length > 0) {
        const uniqueRooms = [...new Set(allConflicts)]
        return NextResponse.json(
          { error: `Le seguenti stanze non sono disponibili: ${uniqueRooms.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Crea la prenotazione con le stanze collegate
    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        propertyId,
        roomId: selectedRoomIds.length === 1 ? selectedRoomIds[0] : null, // Retrocompatibilità
        guestName: guestName || 'Ospite',
        guestEmail: guestEmail || '',
        guestPhone: guestPhone || null,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: checkOut ? new Date(checkOut) : new Date(),
        guests: guests ? parseInt(guests) : 1,
        totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
        status: status || 'PENDING',
        channel: channel || 'DIRECT',
        channelBookingId,
        notes,
        createdById: session.user.id,
        // Crea le relazioni multi-stanza
        bookingRooms: selectedRoomIds.length > 0 ? {
          create: selectedRoomIds.map(rId => ({ roomId: rId }))
        } : undefined,
      },
      include: {
        property: true,
        room: true,
        bookingRooms: {
          include: { room: true }
        },
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
