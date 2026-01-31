import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Approva check-in e collega a prenotazione
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
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID prenotazione richiesto' },
        { status: 400 }
      )
    }

    // Verifica che il check-in esista
    const checkIn = await prisma.guestCheckIn.findUnique({
      where: { id },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in non trovato' },
        { status: 404 }
      )
    }

    // Verifica che la prenotazione esista
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
        { status: 404 }
      )
    }

    // Approva e collega
    const updatedCheckIn = await prisma.guestCheckIn.update({
      where: { id },
      data: {
        bookingId,
        status: 'APPROVED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Check-in approvato e collegato alla prenotazione',
      checkIn: updatedCheckIn,
    })
  } catch (error) {
    console.error('Errore approvazione check-in:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'approvazione' },
      { status: 500 }
    )
  }
}
