import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lista proprietà e stanze attive (pubblico)
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        city: true,
        // Dati tassa di soggiorno
        touristTaxRate: true,
        touristTaxMaxNights: true,
        touristTaxExemptAge: true,
        // Metodi pagamento
        paypalEmail: true,
        revolutTag: true,
        bankAccountIBAN: true,
        bankAccountHolder: true,
        rooms: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            roomNumber: true,
            type: true,
            maxGuests: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Errore nel recupero proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero proprietà' },
      { status: 500 }
    )
  }
}
