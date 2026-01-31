import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
