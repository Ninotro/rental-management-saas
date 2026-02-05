import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Export check-in in formato PDF
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      // Solo check-in con prenotazione collegata
      bookingId: { not: null },
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate)
      }
    }

    const checkIns = await prisma.guestCheckIn.findMany({
      where,
      include: {
        booking: {
          include: {
            property: {
              select: {
                name: true,
                city: true,
                address: true,
              },
            },
            room: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // Prepara i dati per il PDF
    const pdfData = checkIns.filter(c => c.booking).map((checkIn) => ({
      checkInDate: new Date(checkIn.booking!.checkIn).toLocaleDateString('it-IT'),
      property: checkIn.booking!.property.name,
      propertyAddress: `${checkIn.booking!.property.address}, ${checkIn.booking!.property.city}`,
      room: checkIn.booking!.room?.name || 'N/A',
      lastName: checkIn.lastName,
      firstName: checkIn.firstName,
      sex: checkIn.sex || '',
      dateOfBirth: new Date(checkIn.dateOfBirth).toLocaleDateString('it-IT'),
      placeOfBirth: `${checkIn.birthCity} (${checkIn.birthProvince})`,
      nationality: checkIn.nationality || '',
      fiscalCode: checkIn.fiscalCode || '',
      documentType: checkIn.documentType.replace('_', ' '),
      documentNumber: checkIn.documentNumber,
      documentIssuePlace: checkIn.documentIssuePlace || '',
    }))

    // Ritorna i dati in JSON che verranno processati lato client
    // (jsPDF funziona meglio lato client nel browser)
    return NextResponse.json({
      success: true,
      data: pdfData,
      count: pdfData.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Errore preparazione dati PDF:', error)
    return NextResponse.json(
      { error: 'Errore nella preparazione dati PDF' },
      { status: 500 }
    )
  }
}
