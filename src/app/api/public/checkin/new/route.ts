import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Nuovo check-in con selezione stanza/date (pubblico)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Selezione stanza e date
      roomId,
      checkInDate,
      checkOutDate,
      // Dati anagrafici
      firstName,
      lastName,
      dateOfBirth,
      birthCity,
      birthProvince,
      residenceStreet,
      residencePostalCode,
      residenceCity,
      residenceProvince,
      fiscalCode,
      documentType,
      documentNumber,
      documentIssueDate,
      documentExpiryDate,
      documentFrontUrl,
      documentBackUrl,
      isExempt,
      exemptionReason,
    } = body

    // Validazione campi obbligatori
    if (
      !roomId ||
      !checkInDate ||
      !checkOutDate ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !birthCity ||
      !birthProvince ||
      !residenceStreet ||
      !residencePostalCode ||
      !residenceCity ||
      !residenceProvince ||
      !fiscalCode ||
      !documentType ||
      !documentNumber ||
      !documentIssueDate ||
      !documentExpiryDate
    ) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    // Verifica che la stanza esista
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, propertyId: true },
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Stanza non trovata' },
        { status: 404 }
      )
    }

    // Valida tipo documento
    const validDocumentTypes = ['CARTA_IDENTITA', 'PASSAPORTO', 'PATENTE']
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo documento non valido' },
        { status: 400 }
      )
    }

    const selectedCheckIn = new Date(checkInDate)
    const selectedCheckOut = new Date(checkOutDate)

    // Cerca prenotazione che matcha stanza e date
    // Tolleranza: check-in entro 1 giorno dalla data selezionata
    const oneDayBefore = new Date(selectedCheckIn)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    const oneDayAfter = new Date(selectedCheckIn)
    oneDayAfter.setDate(oneDayAfter.getDate() + 1)

    const matchingBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: {
          gte: oneDayBefore,
          lte: oneDayAfter,
        },
      },
      orderBy: {
        checkIn: 'asc',
      },
    })

    // Crea il check-in
    const guestCheckIn = await prisma.guestCheckIn.create({
      data: {
        // Collegamento (se trovato match)
        bookingId: matchingBooking?.id || null,
        status: matchingBooking ? 'APPROVED' : 'PENDING',
        // Dati selezionati
        selectedRoomId: roomId,
        selectedCheckIn,
        selectedCheckOut,
        // Dati anagrafici
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        birthCity,
        birthProvince: birthProvince.toUpperCase(),
        residenceStreet,
        residencePostalCode,
        residenceCity,
        residenceProvince: residenceProvince.toUpperCase(),
        fiscalCode: fiscalCode.toUpperCase(),
        documentType,
        documentNumber,
        documentIssueDate: new Date(documentIssueDate),
        documentExpiryDate: new Date(documentExpiryDate),
        documentFrontUrl: documentFrontUrl || null,
        documentBackUrl: documentBackUrl || null,
        isExempt: !!isExempt,
        exemptionReason: exemptionReason || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        checkInId: guestCheckIn.id,
        status: guestCheckIn.status,
        matched: !!matchingBooking,
        message: matchingBooking
          ? 'Check-in completato e collegato alla prenotazione'
          : 'Dati ricevuti. In attesa di approvazione da parte della struttura.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Errore nel salvataggio check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio dati check-in' },
      { status: 500 }
    )
  }
}
