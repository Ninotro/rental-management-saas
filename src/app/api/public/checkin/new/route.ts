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
      // Numero ospiti e ospiti aggiuntivi
      numGuests,
      additionalGuests, // Array JSON con dati degli altri ospiti
      // Dati contatto (opzionali)
      email,
      phone,
      contactPreference, // "whatsapp" o "email"
      // Dati anagrafici ospite principale
      firstName,
      lastName,
      sex, // "M" o "F"
      nationality,
      dateOfBirth,
      birthCity,
      birthProvince,
      fiscalCode, // Opzionale
      documentType,
      documentNumber,
      documentIssuePlace, // Luogo rilascio documento
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
      isExempt,
      exemptionReason,
      touristTaxPaymentProof,
      // Dati fatturazione
      wantsInvoice,
      invoiceType,
      companyName,
      vatNumber,
      sdiCode,
      pecEmail,
      billingAddress,
      billingCity,
      billingProvince,
      billingPostalCode,
      billingCountry,
    } = body

    // Validazione campi obbligatori con messaggio specifico
    const requiredFields: Record<string, string> = {
      roomId: 'Stanza',
      checkInDate: 'Data check-in',
      checkOutDate: 'Data check-out',
      firstName: 'Nome',
      lastName: 'Cognome',
      sex: 'Sesso',
      dateOfBirth: 'Data di nascita',
      birthCity: 'Città di nascita',
      birthProvince: 'Provincia di nascita',
      documentType: 'Tipo documento',
      documentNumber: 'Numero documento',
      documentIssuePlace: 'Luogo rilascio documento',
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

    // Valida sesso
    if (!['M', 'F'].includes(sex)) {
      return NextResponse.json(
        { error: 'Sesso non valido (M o F)' },
        { status: 400 }
      )
    }

    // Validazione foto obbligatorie
    if (!documentFrontUrl) {
      return NextResponse.json(
        { error: 'La foto del fronte del documento è obbligatoria' },
        { status: 400 }
      )
    }
    if (!documentBackUrl) {
      return NextResponse.json(
        { error: 'La foto del retro del documento è obbligatoria' },
        { status: 400 }
      )
    }
    if (!selfieUrl) {
      return NextResponse.json(
        { error: 'Il selfie con documento è obbligatorio' },
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
        // Numero ospiti e ospiti aggiuntivi
        numGuests: numGuests || 1,
        additionalGuests: additionalGuests || null,
        // Dati selezionati
        selectedRoomId: roomId,
        selectedCheckIn,
        selectedCheckOut,
        // Dati contatto (opzionali)
        email: email || null,
        phone: phone || null,
        contactPreference: contactPreference || null,
        // Dati anagrafici
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
        documentFrontUrl: documentFrontUrl,
        documentBackUrl: documentBackUrl,
        selfieUrl: selfieUrl,
        isExempt: !!isExempt,
        exemptionReason: exemptionReason || null,
        touristTaxPaymentProof: touristTaxPaymentProof || null,
        // Dati fatturazione (sempre richiesta)
        wantsInvoice: true,
        invoiceType: invoiceType || 'PRIVATE',
        companyName: invoiceType === 'COMPANY' ? companyName : null,
        vatNumber: invoiceType === 'COMPANY' ? (vatNumber ? vatNumber.toUpperCase() : null) : null,
        sdiCode: sdiCode ? sdiCode.toUpperCase() : null,
        pecEmail: pecEmail ? pecEmail.toLowerCase() : null,
        billingAddress: billingAddress || null,
        billingCity: billingCity || null,
        billingProvince: billingProvince ? billingProvince.toUpperCase() : null,
        billingPostalCode: billingPostalCode || null,
        billingCountry: billingCountry || 'Italia',
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
