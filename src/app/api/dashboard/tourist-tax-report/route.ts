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

        // Ottieni tutti i check-in approvati per questa proprietà nel mese
        // Considera sia booking collegati che check-in diretti
        const checkIns = await prisma.guestCheckIn.findMany({
          where: {
            status: 'APPROVED',
            isExempt: false, // Solo ospiti non esenti
            OR: [
              // Check-in collegati a booking della proprietà
              {
                booking: {
                  roomId: { in: roomIds },
                  checkIn: { lte: endDate },
                  checkOut: { gte: startDate },
                },
              },
              // Check-in diretti (senza booking) per stanze della proprietà
              {
                bookingId: null,
                selectedRoomId: { in: roomIds },
                selectedCheckIn: { lte: endDate },
                selectedCheckOut: { gte: startDate },
              },
            ],
          },
          include: {
            booking: {
              select: {
                checkIn: true,
                checkOut: true,
              },
            },
          },
        })

        let totalGuests = 0
        let totalNights = 0
        let totalTaxableNights = 0 // Notti x Ospiti (max 4 notti per ospite)

        for (const checkIn of checkIns) {
          // Determina le date del soggiorno
          let checkInDate: Date
          let checkOutDate: Date

          if (checkIn.booking) {
            checkInDate = new Date(checkIn.booking.checkIn)
            checkOutDate = new Date(checkIn.booking.checkOut)
          } else if (checkIn.selectedCheckIn && checkIn.selectedCheckOut) {
            checkInDate = new Date(checkIn.selectedCheckIn)
            checkOutDate = new Date(checkIn.selectedCheckOut)
          } else {
            continue // Skip se non ci sono date valide
          }

          // Calcola le notti che cadono nel mese selezionato
          const effectiveStart = checkInDate > startDate ? checkInDate : startDate
          const effectiveEnd = checkOutDate < endDate ? checkOutDate : endDate

          const nightsInMonth = Math.ceil(
            (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (nightsInMonth > 0) {
            // Numero di ospiti per questo check-in (ospite principale + aggiuntivi)
            const guestsCount = checkIn.numGuests || 1

            totalGuests += guestsCount
            totalNights += nightsInMonth

            // Per ogni ospite, il massimo di notti tassabili è 4
            const taxableNightsPerGuest = Math.min(nightsInMonth, maxNights)
            totalTaxableNights += taxableNightsPerGuest * guestsCount
          }
        }

        // Conta anche gli ospiti esenti separatamente per report completo
        const exemptCheckIns = await prisma.guestCheckIn.findMany({
          where: {
            status: 'APPROVED',
            isExempt: true,
            OR: [
              {
                booking: {
                  roomId: { in: roomIds },
                  checkIn: { lte: endDate },
                  checkOut: { gte: startDate },
                },
              },
              {
                bookingId: null,
                selectedRoomId: { in: roomIds },
                selectedCheckIn: { lte: endDate },
                selectedCheckOut: { gte: startDate },
              },
            ],
          },
        })

        const exemptGuests = exemptCheckIns.reduce((sum, c) => sum + (c.numGuests || 1), 0)

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
