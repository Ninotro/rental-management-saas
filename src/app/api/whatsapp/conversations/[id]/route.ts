import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/twilio'

// GET - Ottieni messaggi di una conversazione
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    // Ottieni conversazione con messaggi
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            checkIn: true,
            checkOut: true,
            status: true,
            property: {
              select: {
                id: true,
                name: true,
              }
            },
            room: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversazione non trovata' }, { status: 404 })
    }

    // Ottieni messaggi con paginazione
    const messages = await prisma.whatsAppMessage.findMany({
      where: { conversationId: id },
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      })
    })

    // Controlla se ci sono altri messaggi
    const hasMore = messages.length > limit
    if (hasMore) {
      messages.pop()
    }

    // Inverti l'ordine per la visualizzazione (dal più vecchio al più nuovo)
    messages.reverse()

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        phoneNumber: conversation.phoneNumber,
        guestName: conversation.guestName,
        unreadCount: conversation.unreadCount,
        booking: conversation.booking,
      },
      messages,
      hasMore,
      nextCursor: hasMore ? messages[0]?.id : null,
    })

  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero conversazione' },
      { status: 500 }
    )
  }
}

// POST - Invia nuovo messaggio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    const { body, mediaUrl } = await request.json()

    if (!body || body.trim() === '') {
      return NextResponse.json(
        { error: 'Messaggio vuoto' },
        { status: 400 }
      )
    }

    // Ottieni conversazione
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversazione non trovata' }, { status: 404 })
    }

    // Invia messaggio via Twilio
    let twilioResult
    let status = 'SENT'

    try {
      twilioResult = await sendWhatsAppMessage({
        to: conversation.phoneNumber,
        body: body.trim(),
        mediaUrl: mediaUrl ? [mediaUrl] : undefined,
      })
    } catch (twilioError) {
      console.error('Twilio error:', twilioError)
      status = 'FAILED'
    }

    // Salva messaggio nel database
    const message = await prisma.whatsAppMessage.create({
      data: {
        conversationId: id,
        direction: 'OUTGOING',
        body: body.trim(),
        mediaUrl,
        twilioSid: twilioResult?.sid || null,
        status,
        sentAt: new Date(),
      }
    })

    // Aggiorna lastMessageAt della conversazione
    await prisma.whatsAppConversation.update({
      where: { id },
      data: { lastMessageAt: new Date() }
    })

    return NextResponse.json({
      success: status !== 'FAILED',
      message,
      twilioSid: twilioResult?.sid,
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio del messaggio' },
      { status: 500 }
    )
  }
}

// PATCH - Segna messaggi come letti
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    // Reset unread count
    await prisma.whatsAppConversation.update({
      where: { id },
      data: { unreadCount: 0 }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking as read:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina conversazione
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    await prisma.whatsAppConversation.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione' },
      { status: 500 }
    )
  }
}
