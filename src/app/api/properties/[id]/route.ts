import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Ottieni dettagli proprietà
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
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Proprietà non trovata' }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Errore nel recupero proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero proprietà' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna proprietà
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
      name, address, city, country, description,
      maxGuests, bedrooms, bathrooms, active, accessCodes,
      touristTaxRate, touristTaxMaxNights, touristTaxExemptAge, paypalEmail
    } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (country !== undefined) updateData.country = country
    if (description !== undefined) updateData.description = description
    if (maxGuests !== undefined && maxGuests !== null) updateData.maxGuests = parseInt(maxGuests.toString())
    if (bedrooms !== undefined && bedrooms !== null) updateData.bedrooms = parseInt(bedrooms.toString())
    if (bathrooms !== undefined && bathrooms !== null) updateData.bathrooms = parseInt(bathrooms.toString())
    if (active !== undefined) updateData.active = active
    if (accessCodes !== undefined) updateData.accessCodes = accessCodes
    if (touristTaxRate !== undefined) updateData.touristTaxRate = touristTaxRate !== null ? parseFloat(touristTaxRate.toString()) : null
    if (touristTaxMaxNights !== undefined) updateData.touristTaxMaxNights = touristTaxMaxNights !== null ? parseInt(touristTaxMaxNights.toString()) : null
    if (touristTaxExemptAge !== undefined) updateData.touristTaxExemptAge = touristTaxExemptAge !== null ? parseInt(touristTaxExemptAge.toString()) : null
    if (paypalEmail !== undefined) updateData.paypalEmail = paypalEmail

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(property)
  } catch (error: any) {
    console.error('Errore dettagliato nell\'aggiornamento proprietà:', error)
    return NextResponse.json(
      { error: `Errore nell'aggiornamento proprietà: ${error.message || 'Errore sconosciuto'}` },
      { status: 500 }
    )
  }
}

// DELETE - Elimina proprietà
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
    await prisma.property.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Proprietà eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione proprietà' },
      { status: 500 }
    )
  }
}
