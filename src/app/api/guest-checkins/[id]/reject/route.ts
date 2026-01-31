import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Rifiuta check-in
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params

    // Verifica che il check-in esista
    const checkIn = await prisma.guestCheckIn.findUnique({
      where: { id },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in non trovato' },
        { status: 404 }
      )
    }

    // Rifiuta
    const updatedCheckIn = await prisma.guestCheckIn.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Check-in rifiutato',
      checkIn: updatedCheckIn,
    })
  } catch (error) {
    console.error('Errore rifiuto check-in:', error)
    return NextResponse.json(
      { error: 'Errore durante il rifiuto' },
      { status: 500 }
    )
  }
}
