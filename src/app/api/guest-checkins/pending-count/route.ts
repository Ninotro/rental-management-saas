import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Conta check-in da comunicare (scaduti e non comunicati)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Ottieni tutti i check-in non comunicati (solo con prenotazione collegata)
    const checkIns = await prisma.guestCheckIn.findMany({
      where: {
        submittedToPolice: false,
        bookingId: { not: null },
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

    // Log per debug (solo in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Trovati ${checkIns.length} check-in non comunicati`)
    }

    // Calcola quanti sono scaduti (data di check-in antecedente a oggi)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Imposta a mezzanotte per confronto solo delle date
    
    const overdueCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.booking) return false
      const checkInDate = new Date(checkIn.booking.checkIn)
      checkInDate.setHours(0, 0, 0, 0) // Imposta a mezzanotte per confronto solo delle date
      
      // Considera scaduto se la data di check-in è antecedente (prima) a oggi
      // Esempio: se oggi è il 10 gennaio e il check-in è il 9 gennaio o prima, è scaduto
      const isOverdue = checkInDate < today
      
      // Log per debug (solo in development)
      if (process.env.NODE_ENV === 'development' && isOverdue) {
        console.log('Check-in scaduto:', {
          checkInId: checkIn.id,
          bookingCheckIn: checkInDate.toISOString(),
          today: today.toISOString(),
          isOverdue,
        })
      }
      
      return isOverdue
    })

    const overdueCount = overdueCheckIns.length

    return NextResponse.json({ count: overdueCount })
  } catch (error) {
    console.error('Errore nel conteggio check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel conteggio check-in' },
      { status: 500 }
    )
  }
}
