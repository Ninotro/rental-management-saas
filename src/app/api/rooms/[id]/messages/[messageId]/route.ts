import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Ottieni un singolo messaggio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: roomId, messageId } = await params

    const message = await prisma.roomMessage.findFirst({
      where: {
        id: messageId,
        roomId,
      },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Errore nel recupero messaggio:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero messaggio' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna un messaggio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: roomId, messageId } = await params
    const body = await request.json()
    const { name, subject, messageText, isActive } = body

    // Verifica che il messaggio esista
    const existingMessage = await prisma.roomMessage.findFirst({
      where: {
        id: messageId,
        roomId,
      },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
    }

    // Validazione
    if (!name || !messageText) {
      return NextResponse.json(
        { error: 'Nome e testo del messaggio sono obbligatori' },
        { status: 400 }
      )
    }

    const message = await prisma.roomMessage.update({
      where: { id: messageId },
      data: {
        name,
        subject: subject || null,
        messageText,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Errore nell\'aggiornamento messaggio:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento messaggio' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina un messaggio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: roomId, messageId } = await params

    // Verifica che il messaggio esista
    const existingMessage = await prisma.roomMessage.findFirst({
      where: {
        id: messageId,
        roomId,
      },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
    }

    await prisma.roomMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore nell\'eliminazione messaggio:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione messaggio' },
      { status: 500 }
    )
  }
}
