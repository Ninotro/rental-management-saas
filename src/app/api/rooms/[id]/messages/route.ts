import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Ottieni tutti i messaggi di una stanza
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: roomId } = await params

    // Verifica che la stanza esista
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    })

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
    }

    const messages = await prisma.roomMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      messages,
      room: {
        id: room.id,
        name: room.name,
        propertyName: room.property.name,
      },
    })
  } catch (error) {
    console.error('Errore nel recupero messaggi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero messaggi' },
      { status: 500 }
    )
  }
}

// POST - Crea un nuovo messaggio per una stanza
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: roomId } = await params
    const body = await request.json()
    const { type, name, subject, messageText, isActive } = body

    // Validazione
    if (!name || !messageText) {
      return NextResponse.json(
        { error: 'Nome e testo del messaggio sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che la stanza esista
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 })
    }

    // Verifica se esiste già un messaggio dello stesso tipo per questa stanza
    const existingMessage = await prisma.roomMessage.findUnique({
      where: {
        roomId_type: {
          roomId,
          type: type || 'CHECK_IN_INSTRUCTIONS',
        },
      },
    })

    if (existingMessage) {
      return NextResponse.json(
        { error: 'Esiste già un messaggio di questo tipo per questa stanza. Modificalo invece di crearne uno nuovo.' },
        { status: 400 }
      )
    }

    const message = await prisma.roomMessage.create({
      data: {
        roomId,
        type: type || 'CHECK_IN_INSTRUCTIONS',
        name,
        subject: subject || null,
        messageText,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    )
  } catch (error) {
    console.error('Errore nella creazione messaggio:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione messaggio' },
      { status: 500 }
    )
  }
}
