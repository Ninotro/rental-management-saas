import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lista proprietà e stanze attive + settings globali (pubblico)
export async function GET() {
  try {
    // Recupera proprietà
    const properties = await prisma.property.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        city: true,
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

    // Recupera impostazioni globali (tassa di soggiorno + pagamenti)
    const globalSettings = await prisma.globalSettings.findUnique({
      where: { id: 'singleton' },
    })

    // Ritorna proprietà + settings globali
    return NextResponse.json({
      properties,
      settings: globalSettings ? {
        touristTaxRate: globalSettings.touristTaxRate ? Number(globalSettings.touristTaxRate) : null,
        touristTaxMaxNights: globalSettings.touristTaxMaxNights,
        touristTaxExemptAge: globalSettings.touristTaxExemptAge,
        paypalEmail: globalSettings.paypalEmail,
        revolutTag: globalSettings.revolutTag,
        bankAccountIBAN: globalSettings.bankAccountIBAN,
        bankAccountHolder: globalSettings.bankAccountHolder,
      } : null,
    })
  } catch (error) {
    console.error('Errore nel recupero proprietà:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero proprietà' },
      { status: 500 }
    )
  }
}
