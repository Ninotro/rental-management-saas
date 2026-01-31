import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni dettagli stanza
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
          },
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Errore nel recupero stanza:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero stanza' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna stanza
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      roomNumber,
      type,
      description,
      maxGuests,
      beds,
      size,
      hasPrivateBathroom,
      hasBalcony,
      hasKitchen,
      floor,
      basePrice,
      active,
      airbnbIcalUrl,
      bookingComIcalUrl,
    } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber
    if (type !== undefined) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (maxGuests !== undefined) updateData.maxGuests = parseInt(maxGuests)
    if (beds !== undefined) updateData.beds = parseInt(beds)
    if (size !== undefined) updateData.size = parseFloat(size)
    if (hasPrivateBathroom !== undefined) updateData.hasPrivateBathroom = hasPrivateBathroom
    if (hasBalcony !== undefined) updateData.hasBalcony = hasBalcony
    if (hasKitchen !== undefined) updateData.hasKitchen = hasKitchen
    if (floor !== undefined) updateData.floor = floor ? parseInt(floor) : null
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
    if (active !== undefined) updateData.active = active
    if (airbnbIcalUrl !== undefined) updateData.airbnbIcalUrl = airbnbIcalUrl
    if (bookingComIcalUrl !== undefined) updateData.bookingComIcalUrl = bookingComIcalUrl

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Errore nell\'aggiornamento stanza:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento stanza' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina stanza
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    // Verifica se ci sono prenotazioni attive
    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare stanza con prenotazioni attive' },
        { status: 400 }
      )
    }

    await prisma.room.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Stanza eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione stanza:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione stanza' },
      { status: 500 }
    )
  }
}
