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
      // Dati contatto
      email,
      phone,
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
      touristTaxPaymentProof,
    } = body

    // Validazione campi obbligatori con messaggio specifico
    const requiredFields: Record<string, string> = {
      roomId: 'Stanza',
      checkInDate: 'Data check-in',
      checkOutDate: 'Data check-out',
      firstName: 'Nome',
      lastName: 'Cognome',
      dateOfBirth: 'Data di nascita',
      birthCity: 'Città di nascita',
      birthProvince: 'Provincia di nascita',
      residenceStreet: 'Indirizzo',
      residencePostalCode: 'CAP',
      residenceCity: 'Città di residenza',
      residenceProvince: 'Provincia di residenza',
      fiscalCode: 'Codice fiscale',
      documentType: 'Tipo documento',
      documentNumber: 'Numero documento',
      documentIssueDate: 'Data rilascio documento',
      documentExpiryDate: 'Data scadenza documento',
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field] || body[field].toString().trim() === '') {
        return NextResponse.json(
          { error: `Il campo "${label}" è obbligatorio` },
          { status: 400 }
        )
      }
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

    // Crea il check-in - SEMPRE PENDING, l'admin approva manualmente
    const guestCheckIn = await prisma.guestCheckIn.create({
      data: {
        // Mai collegamento automatico - l'admin decide
        bookingId: null,
        status: 'PENDING',
        // Dati selezionati
        selectedRoomId: roomId,
        selectedCheckIn,
        selectedCheckOut,
        // Dati contatto
        email: email || null,
        phone: phone || null,
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
        touristTaxPaymentProof: touristTaxPaymentProof || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        checkInId: guestCheckIn.id,
        status: 'PENDING',
        message: 'Dati ricevuti correttamente. La struttura verificherà i tuoi dati e confermerà il check-in.',
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
