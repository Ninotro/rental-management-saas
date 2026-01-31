import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni dettagli prenotazione
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
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        transactions: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Errore nel recupero prenotazione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero prenotazione' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna prenotazione
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
    const {
      propertyId,
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status,
      channel,
      channelBookingId,
      notes,
      touristTaxTotal,
      touristTaxPaid,
      touristTaxPaymentProof
    } = body

    const updateData: any = {}

    if (propertyId !== undefined) updateData.propertyId = propertyId
    if (roomId !== undefined) updateData.roomId = roomId
    if (guestName !== undefined) updateData.guestName = guestName
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn)
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut)
    if (guests !== undefined) updateData.guests = parseInt(guests)
    if (totalPrice !== undefined) updateData.totalPrice = parseFloat(totalPrice)
    if (status !== undefined) updateData.status = status
    if (channel !== undefined) updateData.channel = channel
    if (channelBookingId !== undefined) updateData.channelBookingId = channelBookingId
    if (notes !== undefined) updateData.notes = notes
    if (touristTaxTotal !== undefined) updateData.touristTaxTotal = touristTaxTotal !== null ? parseFloat(touristTaxTotal.toString()) : null
    if (touristTaxPaid !== undefined) updateData.touristTaxPaid = !!touristTaxPaid
    if (touristTaxPaymentProof !== undefined) updateData.touristTaxPaymentProof = touristTaxPaymentProof

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        room: true,
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Errore nell\'aggiornamento prenotazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento prenotazione' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina prenotazione
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
    await prisma.booking.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Prenotazione eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione prenotazione:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione prenotazione' },
      { status: 500 }
    )
  }
}
