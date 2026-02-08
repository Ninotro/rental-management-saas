import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, replaceTemplateVariables, textToHtml } from '@/lib/email'

// POST - Invia un messaggio per una prenotazione
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: bookingId } = await params
    const body = await request.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'ID messaggio richiesto' },
        { status: 400 }
      )
    }

    // Recupera la prenotazione con tutti i dati necessari
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        room: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    // Verifica che l'email dell'ospite sia presente
    if (!booking.guestEmail) {
      return NextResponse.json(
        { error: 'Email dell\'ospite non disponibile' },
        { status: 400 }
      )
    }

    // Recupera il template del messaggio
    const messageTemplate = await prisma.roomMessage.findUnique({
      where: { id: messageId },
    })

    if (!messageTemplate) {
      return NextResponse.json({ error: 'Template messaggio non trovato' }, { status: 404 })
    }

    // Prepara i dati per la sostituzione delle variabili
    const bookingData = {
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalPrice: Number(booking.totalPrice),
      bookingCode: booking.bookingCode,
      property: {
        name: booking.property.name,
        address: booking.property.address,
        city: booking.property.city,
      },
      room: booking.room ? { name: booking.room.name } : null,
    }

    // Sostituisci le variabili nel template
    const subject = replaceTemplateVariables(messageTemplate.subject || messageTemplate.name, bookingData)
    const messageContent = replaceTemplateVariables(messageTemplate.messageText, bookingData)
    const htmlContent = textToHtml(messageContent)

    // Crea il record del messaggio inviato (PENDING)
    const sentMessage = await prisma.sentMessage.create({
      data: {
        bookingId,
        messageId,
        channel: 'EMAIL',
        status: 'PENDING',
        recipientEmail: booking.guestEmail,
        subject,
        messageContent,
      },
    })

    // Invia l'email
    const result = await sendEmail({
      to: booking.guestEmail,
      subject,
      html: htmlContent,
    })

    // Aggiorna lo stato del messaggio inviato
    await prisma.sentMessage.update({
      where: { id: sentMessage.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email inviata a ${booking.guestEmail}`,
      })
    } else {
      return NextResponse.json(
        { error: `Errore invio email: ${result.error}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Errore nell\'invio messaggio:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio del messaggio' },
      { status: 500 }
    )
  }
}

// GET - Ottieni i messaggi disponibili per una prenotazione e lo storico invii
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id: bookingId } = await params

    // Recupera la prenotazione
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    // Recupera i template messaggi della stanza (se esiste)
    let availableMessages: any[] = []
    if (booking.roomId) {
      availableMessages = await prisma.roomMessage.findMany({
        where: {
          roomId: booking.roomId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    // Recupera lo storico dei messaggi inviati per questa prenotazione
    const sentMessages = await prisma.sentMessage.findMany({
      where: { bookingId },
      include: {
        message: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      availableMessages,
      sentMessages,
      hasEmail: !!booking.guestEmail,
      guestEmail: booking.guestEmail,
    })
  } catch (error) {
    console.error('Errore nel recupero messaggi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero messaggi' },
      { status: 500 }
    )
  }
}
