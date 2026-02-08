import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Lista tutte le conversazioni
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Query conversazioni con ultimo messaggio
    const conversations = await prisma.whatsAppConversation.findMany({
      where: search ? {
        OR: [
          { guestName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
        ]
      } : undefined,
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
            property: {
              select: {
                name: true,
              }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            body: true,
            direction: true,
            sentAt: true,
            status: true,
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Formatta la risposta
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      phoneNumber: conv.phoneNumber,
      guestName: conv.guestName || conv.booking?.guestName || 'Sconosciuto',
      unreadCount: conv.unreadCount,
      lastMessageAt: conv.lastMessageAt,
      booking: conv.booking,
      lastMessage: conv.messages[0] || null,
    }))

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero conversazioni' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova conversazione (per iniziare chat con un numero)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { phoneNumber, guestName, bookingId } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Numero di telefono richiesto' },
        { status: 400 }
      )
    }

    // Normalizza il numero (rimuovi spazi e aggiungi + se manca)
    let normalizedPhone = phoneNumber.replace(/\s/g, '')
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone
    }

    // Verifica se esiste già
    const existing = await prisma.whatsAppConversation.findUnique({
      where: { phoneNumber: normalizedPhone }
    })

    if (existing) {
      return NextResponse.json({ conversation: existing })
    }

    // Crea nuova conversazione
    const conversation = await prisma.whatsAppConversation.create({
      data: {
        phoneNumber: normalizedPhone,
        guestName,
        bookingId,
      }
    })

    return NextResponse.json({ conversation }, { status: 201 })

  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione conversazione' },
      { status: 500 }
    )
  }
}
