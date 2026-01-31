import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni lista proprietà
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const properties = await prisma.property.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Errore nel recupero proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero proprietà' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova proprietà
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, city, country, description, maxGuests, bedrooms, bathrooms } = body

    // Validazione
    if (!name || !address || !city || !country || !maxGuests || !bedrooms || !bathrooms) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        country,
        description,
        maxGuests: parseInt(maxGuests),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione proprietà' },
      { status: 500 }
    )
  }
}
