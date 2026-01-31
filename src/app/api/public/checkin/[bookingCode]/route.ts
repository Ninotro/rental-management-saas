import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidBookingCode } from '@/lib/bookingCode'

// GET - Ottieni info prenotazione con booking code (pubblico, no auth richiesta)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingCode: string }> }
) {
  try {
    const { bookingCode } = await params

    // Valida formato codice
    if (!isValidBookingCode(bookingCode)) {
      return NextResponse.json(
        { error: 'Codice prenotazione non valido' },
        { status: 400 }
      )
    }

    // Cerca prenotazione e impostazioni globali
    const [booking, settings] = await Promise.all([
      prisma.booking.findUnique({
        where: { bookingCode },
        include: {
          property: {
            select: {
              name: true,
              address: true,
              city: true,
              country: true,
            },
          },
          room: {
            select: {
              name: true,
              type: true,
            },
          },
          guestCheckIns: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              submittedAt: true,
            },
          },
        },
      }),
      prisma.globalSettings.findUnique({
        where: { id: 'singleton' }
      })
    ])

    if (!booking) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
        { status: 404 }
      )
    }

    const b = booking as any

    // Ritorna solo i dati necessari per il guest, includendo le tasse globali
    return NextResponse.json({
      id: b.id,
      bookingCode: b.bookingCode,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: b.guests,
      totalPrice: b.totalPrice,
      status: b.status,
      property: {
        ...b.property,
        touristTaxRate: settings?.touristTaxRate || 4.00,
        touristTaxMaxNights: settings?.touristTaxMaxNights || 4,
        touristTaxExemptAge: settings?.touristTaxExemptAge || 12,
        paypalEmail: settings?.paypalEmail,
        revolutTag: settings?.revolutTag,
        bankAccountIBAN: settings?.bankAccountIBAN,
        bankAccountHolder: settings?.bankAccountHolder,
      },
      room: b.room,
      hasCheckInData: b.guestCheckIns.length > 0,
      checkInsCount: b.guestCheckIns.length,
    })
  } catch (error) {
    console.error('Errore nel recupero prenotazione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero prenotazione' },
      { status: 500 }
    )
  }
}
