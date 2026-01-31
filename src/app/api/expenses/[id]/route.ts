import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni singola spesa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Spesa non trovata' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Errore nel recupero spesa:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero spesa' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna spesa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, amount, category, date, description, receiptUrl } = body

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(propertyId !== undefined && { propertyId: propertyId || null }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(description !== undefined && { description }),
        ...(receiptUrl !== undefined && { receiptUrl: receiptUrl || null }),
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Errore nell\'aggiornamento spesa:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento spesa' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina spesa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Spesa eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione spesa:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione spesa' },
      { status: 500 }
    )
  }
}
