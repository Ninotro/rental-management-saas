import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni lista stanze di una proprietà
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
    const rooms = await prisma.room.findMany({
      where: { propertyId: id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Errore nel recupero stanze:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero stanze' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova stanza
export async function POST(
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
    } = body

    // Validazione
    if (!name || !type || !maxGuests || !beds || !basePrice) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        propertyId: id,
        name,
        roomNumber,
        type,
        description,
        maxGuests: parseInt(maxGuests),
        beds: parseInt(beds),
        size: size ? parseFloat(size) : null,
        hasPrivateBathroom: hasPrivateBathroom || false,
        hasBalcony: hasBalcony || false,
        hasKitchen: hasKitchen || false,
        floor: floor ? parseInt(floor) : null,
        basePrice: parseFloat(basePrice),
      },
    })

    // Aggiorna il flag hasRooms della proprietà
    await prisma.property.update({
      where: { id },
      data: { hasRooms: true },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione stanza:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione stanza' },
      { status: 500 }
    )
  }
}
