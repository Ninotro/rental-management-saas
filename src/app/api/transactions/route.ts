import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni transazioni
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        booking: {
          select: {
            guestName: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Errore nel recupero transazioni:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero transazioni' },
      { status: 500 }
    )
  }
}

// POST - Crea transazione
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, amount, type, description } = body

    // Validazione
    if (!amount || !type || !description) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: amount, type, description' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        bookingId: bookingId || null,
        amount: parseFloat(amount),
        type,
        description,
        date: new Date(),
        createdById: session.user.id,
      },
      include: {
        booking: {
          select: {
            guestName: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione transazione:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione transazione' },
      { status: 500 }
    )
  }
}
