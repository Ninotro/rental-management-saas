import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Genera report tassa di soggiorno per mese e struttura
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calcola il range di date per il mese selezionato
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59) // Ultimo giorno del mese

    // Valori fissi per la tassa di soggiorno (4€ per notte/ospite, max 4 notti)
    const taxRate = 4
    const maxNights = 4

    // Ottieni tutte le proprietà dell'utente
    const properties = await prisma.property.findMany({
      where: {
        userAccess: {
          some: {
            userId: session.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
      },
    })

    // Per ogni proprietà, calcola i dati del report
    const reportData = await Promise.all(
      properties.map(async (property) => {
        // Ottieni tutte le stanze della proprietà
        const rooms = await prisma.room.findMany({
          where: { propertyId: property.id },
          select: { id: true },
        })
        const roomIds = rooms.map(r => r.id)

        // Ottieni tutte le prenotazioni (non cancellate) per questa proprietà nel mese
        const bookings = await prisma.booking.findMany({
          where: {
            status: { not: 'CANCELLED' },
            roomId: { in: roomIds },
            checkIn: { lte: endDate },
            checkOut: { gte: startDate },
          },
          select: {
            id: true,
            guests: true,
            checkIn: true,
            checkOut: true,
          },
        })

        console.log(`✅ DEBUG - Prenotazioni (non cancellate) per ${property.name}:`, bookings.length)
        if (bookings.length > 0) {
          console.log('Prenotazione sample:', bookings[0])
        }

        let totalGuests = 0
        let totalNights = 0
        let totalTaxableNights = 0 // Notti x Ospiti (max 4 notti per ospite)

        for (const booking of bookings) {
          const checkInDate = new Date(booking.checkIn)
          const checkOutDate = new Date(booking.checkOut)

          // Calcola le notti che cadono nel mese selezionato
          const effectiveStart = checkInDate > startDate ? checkInDate : startDate
          const effectiveEnd = checkOutDate < endDate ? checkOutDate : endDate

          const nightsInMonth = Math.ceil(
            (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (nightsInMonth > 0) {
            // Numero di ospiti dalla prenotazione
            const guestsCount = booking.guests

            totalGuests += guestsCount
            totalNights += nightsInMonth

            // Per ogni ospite, il massimo di notti tassabili è 4
            const taxableNightsPerGuest = Math.min(nightsInMonth, maxNights)
            totalTaxableNights += taxableNightsPerGuest * guestsCount
          }
        }

        // Per gli ospiti esenti, non li contiamo più perché non sono nelle prenotazioni
        // ma nei check-in individuali (per la questura)
        const exemptGuests = 0

        // Calcola il totale tassa (tariffa fissa 4€)
        const totalTax = totalTaxableNights * taxRate

        return {
          propertyId: property.id,
          propertyName: property.name,
          totalGuests,
          totalNights,
          totalTaxableNights,
          totalTax,
          exemptGuests,
          taxRate,
          maxNights,
        }
      })
    )

    // Calcola i totali complessivi
    const totals = reportData.reduce(
      (acc, item) => ({
        totalGuests: acc.totalGuests + item.totalGuests,
        totalNights: acc.totalNights + item.totalNights,
        totalTaxableNights: acc.totalTaxableNights + item.totalTaxableNights,
        totalTax: acc.totalTax + item.totalTax,
        exemptGuests: acc.exemptGuests + item.exemptGuests,
      }),
      { totalGuests: 0, totalNights: 0, totalTaxableNights: 0, totalTax: 0, exemptGuests: 0 }
    )

    return NextResponse.json({
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'long' }),
      properties: reportData,
      totals,
    })
  } catch (error) {
    console.error('Errore nel calcolo report tassa di soggiorno:', error)
    return NextResponse.json(
      { error: 'Errore nel calcolo del report' },
      { status: 500 }
    )
  }
}
