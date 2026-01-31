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

    // Conta quanti check-in sono già associati a questa prenotazione
    const existingCheckIns = await prisma.guestCheckIn.count({
      where: {
        bookingId,
        status: 'APPROVED',
      },
    })

    // Approva e collega
    const updatedCheckIn = await prisma.guestCheckIn.update({
      where: { id },
      data: {
        bookingId,
        status: 'APPROVED',
      },
    })

    // Conta totale ospiti (incluso questo appena approvato)
    const totalGuests = existingCheckIns + 1

    // Se è il primo check-in approvato per questa prenotazione, aggiorna nome, email, telefono e numero ospiti
    if (existingCheckIns === 0) {
      // Aggiorna la prenotazione con nome, cognome, email, telefono e numero ospiti del primo ospite
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          guestName: `${checkIn.firstName} ${checkIn.lastName}`,
          guestEmail: checkIn.email || undefined,
          guestPhone: checkIn.phone || undefined,
          guests: totalGuests,
        },
      })
    } else {
      // Se ci sono già altri ospiti, aggiungi +N al nome e aggiorna numero ospiti
      // Recupera il primo check-in approvato per ottenere il nome principale
      const firstCheckIn = await prisma.guestCheckIn.findFirst({
        where: {
          bookingId,
          status: 'APPROVED',
          id: { not: id }, // Escludi quello appena approvato
        },
        orderBy: { submittedAt: 'asc' },
      })

      if (firstCheckIn) {
        const baseName = `${firstCheckIn.firstName} ${firstCheckIn.lastName}`
        const additionalGuests = totalGuests - 1
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            guestName: additionalGuests > 0 ? `${baseName} +${additionalGuests}` : baseName,
            guests: totalGuests,
          },
        })
      }
    }

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
