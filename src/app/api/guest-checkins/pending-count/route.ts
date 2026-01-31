import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Conta check-in da comunicare (scaduti) + check-in in attesa approvazione
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Conta check-in in attesa di approvazione (status = PENDING)
    const pendingApprovalCount = await prisma.guestCheckIn.count({
      where: {
        status: 'PENDING',
      },
    })

    // Ottieni tutti i check-in non comunicati (solo con prenotazione collegata)
    const checkIns = await prisma.guestCheckIn.findMany({
      where: {
        submittedToPolice: false,
        bookingId: { not: null },
        status: 'APPROVED', // Solo quelli approvati
      },
      include: {
        booking: {
          select: {
            checkIn: true,
            id: true,
          },
        },
      },
    })

    // Calcola quanti sono scaduti (data di check-in antecedente a oggi)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.booking) return false
      const checkInDate = new Date(checkIn.booking.checkIn)
      checkInDate.setHours(0, 0, 0, 0)
      return checkInDate < today
    })

    const overdueCount = overdueCheckIns.length

    // Somma: pending approval + overdue = totale badge
    const totalCount = pendingApprovalCount + overdueCount

    return NextResponse.json({
      count: totalCount,
      pendingApproval: pendingApprovalCount,
      overdue: overdueCount,
    })
  } catch (error) {
    console.error('Errore nel conteggio check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel conteggio check-in' },
      { status: 500 }
    )
  }
}
