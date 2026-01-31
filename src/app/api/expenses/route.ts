import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni spese
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const category = searchParams.get('category')

    const where: any = {}

    if (propertyId) {
      where.propertyId = propertyId
    }

    if (category) {
      where.category = category
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Errore nel recupero spese:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero spese' },
      { status: 500 }
    )
  }
}

// POST - Crea spesa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, amount, category, date, description, receiptUrl } = body

    // Validazione
    if (!amount || !category || !date || !description) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId: propertyId || null,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        receiptUrl: receiptUrl || null,
        createdById: session.user.id,
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione spesa:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione spesa' },
      { status: 500 }
    )
  }
}
