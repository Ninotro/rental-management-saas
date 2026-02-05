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
      sex,
      nationality,
      dateOfBirth,
      birthCity,
      birthProvince,
      fiscalCode,
      documentType,
      documentNumber,
      documentIssuePlace,
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
      !sex ||
      !dateOfBirth ||
      !birthCity ||
      !birthProvince ||
      !documentType ||
      !documentNumber ||
      !documentIssuePlace
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

    // Valida sesso
    if (!['M', 'F'].includes(sex)) {
      return NextResponse.json(
        { error: 'Sesso non valido (M o F)' },
        { status: 400 }
      )
    }

    // Salva i dati del check-in
    const guestCheckIn = await prisma.guestCheckIn.create({
      data: {
        bookingId: booking.id,
        status: 'APPROVED', // Auto-approved se collegato a booking
        firstName,
        lastName,
        sex,
        nationality: nationality || null,
        dateOfBirth: new Date(dateOfBirth),
        birthCity,
        birthProvince: birthProvince.toUpperCase(),
        fiscalCode: fiscalCode ? fiscalCode.toUpperCase() : null,
        documentType,
        documentNumber,
        documentIssuePlace: documentIssuePlace || null,
        documentFrontUrl: documentFrontUrl || null,
        documentBackUrl: documentBackUrl || null,
        isExempt: !!isExempt,
        exemptionReason: exemptionReason || null,
      },
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
