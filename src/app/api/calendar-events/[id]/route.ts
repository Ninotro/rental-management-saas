import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// DELETE - Elimina evento
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
    await prisma.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Evento eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione evento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione evento' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna evento
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
    const { startDate, endDate, type, title, description } = body

    const updateData: any = {}

    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    // Verifica che la data di fine sia dopo la data di inizio
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate < updateData.startDate) {
        return NextResponse.json(
          { error: 'La data di fine deve essere dopo la data di inizio' },
          { status: 400 }
        )
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Errore nell\'aggiornamento evento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento evento' },
      { status: 500 }
    )
  }
}
