import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidBookingCode } from '@/lib/bookingCode'

// POST - Salva dati check-in guest (pubblico, no auth richiesta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      bookingCode,
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
      !bookingCode ||
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

    // Valida formato codice prenotazione
    if (!isValidBookingCode(bookingCode)) {
      return NextResponse.json(
        { error: 'Codice prenotazione non valido' },
        { status: 400 }
      )
    }

    // Verifica che la prenotazione esista
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Prenotazione non trovata' },
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

    // Salva i dati del check-in
    const guestCheckIn = await prisma.guestCheckIn.create({
      data: {
        bookingId: booking.id,
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
        documentFrontUrl,
        documentBackUrl,
        isExempt: !!isExempt,
        exemptionReason: exemptionReason || null,
      } as any,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Dati check-in salvati con successo',
        checkInId: guestCheckIn.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Errore nel salvataggio dati check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio dati check-in' },
      { status: 500 }
    )
  }
}
