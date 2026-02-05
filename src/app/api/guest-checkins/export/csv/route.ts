import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Export check-in in formato CSV (per Excel)
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

    // Genera CSV
    const headers = [
      'Data Arrivo',
      'Struttura',
      'Indirizzo Struttura',
      'Città',
      'Stanza',
      'Cognome',
      'Nome',
      'Sesso',
      'Data Nascita',
      'Città Nascita',
      'Provincia Nascita',
      'Nazionalità',
      'Codice Fiscale',
      'Tipo Documento',
      'Numero Documento',
      'Luogo Rilascio Documento',
      'Data Check-in Compilato',
    ]

    const rows = checkIns.filter(c => c.booking).map((checkIn) => [
      new Date(checkIn.booking!.checkIn).toLocaleDateString('it-IT'),
      checkIn.booking!.property.name,
      checkIn.booking!.property.address,
      checkIn.booking!.property.city,
      checkIn.booking!.room?.name || 'N/A',
      checkIn.lastName,
      checkIn.firstName,
      checkIn.sex || '',
      new Date(checkIn.dateOfBirth).toLocaleDateString('it-IT'),
      checkIn.birthCity,
      checkIn.birthProvince,
      checkIn.nationality || '',
      checkIn.fiscalCode || '',
      checkIn.documentType.replace('_', ' '),
      checkIn.documentNumber,
      checkIn.documentIssuePlace || '',
      new Date(checkIn.submittedAt).toLocaleString('it-IT'),
    ])

    // Crea CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Aggiungi BOM per Excel
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Ritorna CSV file
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="check-in-ospiti-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Errore export CSV:', error)
    return NextResponse.json(
      { error: 'Errore nell\'export CSV' },
      { status: 500 }
    )
  }
}
