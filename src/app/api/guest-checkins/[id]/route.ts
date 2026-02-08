import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni singolo check-in
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params

    const checkIn = await prisma.guestCheckIn.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            property: { select: { name: true, city: true, address: true } },
            room: { select: { name: true } },
          },
        },
        selectedRoom: {
          include: {
            property: { select: { name: true, city: true, address: true } },
          },
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in non trovato' }, { status: 404 })
    }

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('Errore nel recupero check-in:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero check-in' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna tutti i dati del check-in
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Campi aggiornabili
    const {
      status,
      firstName,
      lastName,
      email,
      phone,
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
      submittedToPolice,
      numGuests,
      additionalGuests,
      nationality,
    } = body

    // Costruisci oggetto di aggiornamento solo con i campi forniti
    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth)
    if (birthCity !== undefined) updateData.birthCity = birthCity
    if (birthProvince !== undefined) updateData.birthProvince = birthProvince.toUpperCase()
    if (residenceStreet !== undefined) updateData.residenceStreet = residenceStreet
    if (residencePostalCode !== undefined) updateData.residencePostalCode = residencePostalCode
    if (residenceCity !== undefined) updateData.residenceCity = residenceCity
    if (residenceProvince !== undefined) updateData.residenceProvince = residenceProvince.toUpperCase()
    if (fiscalCode !== undefined) updateData.fiscalCode = fiscalCode.toUpperCase()
    if (documentType !== undefined) updateData.documentType = documentType
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber
    if (documentIssueDate !== undefined) updateData.documentIssueDate = new Date(documentIssueDate)
    if (documentExpiryDate !== undefined) updateData.documentExpiryDate = new Date(documentExpiryDate)
    if (documentFrontUrl !== undefined) updateData.documentFrontUrl = documentFrontUrl
    if (documentBackUrl !== undefined) updateData.documentBackUrl = documentBackUrl
    if (isExempt !== undefined) updateData.isExempt = isExempt
    if (exemptionReason !== undefined) updateData.exemptionReason = exemptionReason
    if (touristTaxPaymentProof !== undefined) updateData.touristTaxPaymentProof = touristTaxPaymentProof
    if (submittedToPolice !== undefined) {
      updateData.submittedToPolice = submittedToPolice
      updateData.submittedToPoliceAt = submittedToPolice ? new Date() : null
    }
    if (numGuests !== undefined) updateData.numGuests = numGuests
    if (additionalGuests !== undefined) updateData.additionalGuests = additionalGuests
    if (nationality !== undefined) updateData.nationality = nationality

    const checkIn = await prisma.guestCheckIn.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('Errore nell\'aggiornamento check-in:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento check-in' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina check-in
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params

    // Prima recupera il check-in per sapere se era collegato a una prenotazione
    const checkIn = await prisma.guestCheckIn.findUnique({
      where: { id },
      select: { bookingId: true, status: true },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in non trovato' }, { status: 404 })
    }

    const wasLinkedToBooking = checkIn.bookingId && checkIn.status === 'APPROVED'
    const bookingId = checkIn.bookingId

    // Elimina il check-in
    await prisma.guestCheckIn.delete({
      where: { id },
    })

    // Se era collegato a una prenotazione, aggiorna i dati della prenotazione
    if (wasLinkedToBooking && bookingId) {
      // Conta i check-in rimanenti approvati per questa prenotazione
      const remainingCheckIns = await prisma.guestCheckIn.findMany({
        where: {
          bookingId,
          status: 'APPROVED',
        },
        orderBy: { submittedAt: 'asc' },
      })

      if (remainingCheckIns.length === 0) {
        // Nessun check-in rimasto - "libera" la prenotazione
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            guestName: 'Da assegnare',
            guestEmail: '',
            guestPhone: '',
            guests: 1, // Reset a 1 ospite di default
          },
        })
      } else {
        // Ci sono ancora check-in - aggiorna con il primo ospite rimasto
        const firstCheckIn = remainingCheckIns[0]
        const totalGuests = remainingCheckIns.length
        const baseName = `${firstCheckIn.firstName} ${firstCheckIn.lastName}`
        const additionalGuests = totalGuests - 1

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            guestName: additionalGuests > 0 ? `${baseName} +${additionalGuests}` : baseName,
            guestEmail: firstCheckIn.email || '',
            guestPhone: firstCheckIn.phone || '',
            guests: totalGuests,
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Check-in eliminato' })
  } catch (error) {
    console.error('Errore nell\'eliminazione check-in:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione check-in' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna stato comunicazione Questura
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { submittedToPolice } = body

    // Aggiorna lo stato
    const checkIn = await prisma.guestCheckIn.update({
      where: { id },
      data: {
        submittedToPolice,
        submittedToPoliceAt: submittedToPolice ? new Date() : null,
      },
    })

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('Errore nell\'aggiornamento check-in:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento check-in' },
      { status: 500 }
    )
  }
}
