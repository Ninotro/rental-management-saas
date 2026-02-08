import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, replaceTemplateVariables, textToHtml } from '@/lib/email'
import { sendWhatsAppTemplateMessage, convertVariablesToTwilioFormat } from '@/lib/twilio-templates'

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
        guestCheckIns: {
          orderBy: { submittedAt: 'desc' },
          take: 1, // Prendi il check-in più recente
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    // Recupera la preferenza di contatto dal check-in (se presente)
    const guestCheckIn = booking.guestCheckIns?.[0]
    const contactPreference = guestCheckIn?.contactPreference || 'email' // Default: email

    // Verifica che l'email o il telefono dell'ospite sia presente in base alla preferenza
    if (contactPreference === 'email' && !booking.guestEmail) {
      return NextResponse.json(
        { error: 'Email dell\'ospite non disponibile' },
        { status: 400 }
      )
    }

    if (contactPreference === 'whatsapp' && !booking.guestPhone) {
      return NextResponse.json(
        { error: 'Numero di telefono dell\'ospite non disponibile per WhatsApp' },
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

    // Determina il canale da usare basandosi sulla preferenza dell'ospite e sul template
    // Se l'ospite preferisce WhatsApp e il template lo supporta, usa WhatsApp
    // Altrimenti usa Email
    const templateSupportsWhatsApp = messageTemplate.channel === 'WHATSAPP' || messageTemplate.channel === 'BOTH'
    const templateSupportsEmail = messageTemplate.channel === 'EMAIL' || messageTemplate.channel === 'BOTH'
    const templateApproved = messageTemplate.twilioApprovalStatus === 'approved'

    let useWhatsApp = false
    let useEmail = false

    if (contactPreference === 'whatsapp' && templateSupportsWhatsApp && templateApproved && booking.guestPhone) {
      useWhatsApp = true
    } else if (templateSupportsEmail && booking.guestEmail) {
      useEmail = true
    } else if (templateSupportsWhatsApp && templateApproved && booking.guestPhone) {
      // Fallback a WhatsApp se email non disponibile
      useWhatsApp = true
    }

    if (!useWhatsApp && !useEmail) {
      return NextResponse.json(
        { error: 'Impossibile inviare: nessun canale disponibile. Verifica email/telefono e stato template.' },
        { status: 400 }
      )
    }

    // Crea il record del messaggio inviato (PENDING)
    const sentMessage = await prisma.sentMessage.create({
      data: {
        bookingId,
        messageId,
        channel: useWhatsApp ? 'WHATSAPP' : 'EMAIL',
        status: 'PENDING',
        recipientEmail: useEmail ? booking.guestEmail : null,
        recipientPhone: useWhatsApp ? booking.guestPhone : null,
        subject: useEmail ? subject : null,
        messageContent,
      },
    })

    let result: { success: boolean; error?: string }

    if (useWhatsApp) {
      // Invia via WhatsApp usando il template approvato
      const { variables } = convertVariablesToTwilioFormat(messageTemplate.messageText)

      // Costruisci i valori delle variabili nell'ordine corretto
      const variableValues: Record<string, string> = {}
      Object.entries(variables).forEach(([varName, index]) => {
        let value = ''
        switch (varName) {
          case 'guest_name': value = booking.guestName; break
          case 'property_name': value = booking.property.name; break
          case 'room_name': value = booking.room?.name || ''; break
          case 'check_in_date': value = new Date(booking.checkIn).toLocaleDateString('it-IT'); break
          case 'check_out_date': value = new Date(booking.checkOut).toLocaleDateString('it-IT'); break
          case 'booking_code': value = booking.bookingCode || ''; break
          case 'access_codes': value = booking.property.accessCodes ? Object.entries(booking.property.accessCodes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ') : ''; break
          case 'num_guests': value = booking.guests.toString(); break
          case 'total_price': value = `€ ${Number(booking.totalPrice).toFixed(2)}`; break
          default: value = ''
        }
        variableValues[varName] = value
      })

      const whatsappResult = await sendWhatsAppTemplateMessage({
        to: booking.guestPhone!,
        contentSid: messageTemplate.twilioContentSid!,
        variables: variableValues,
      })

      result = {
        success: whatsappResult.success,
        error: whatsappResult.error,
      }
    } else {
      // Invia via Email
      result = await sendEmail({
        to: booking.guestEmail!,
        subject,
        html: htmlContent,
      })
    }

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
      const destination = useWhatsApp ? `WhatsApp ${booking.guestPhone}` : `email ${booking.guestEmail}`
      return NextResponse.json({
        success: true,
        message: `Messaggio inviato via ${useWhatsApp ? 'WhatsApp' : 'Email'} a ${useWhatsApp ? booking.guestPhone : booking.guestEmail}`,
        channel: useWhatsApp ? 'WHATSAPP' : 'EMAIL',
        contactPreference,
      })
    } else {
      return NextResponse.json(
        { error: `Errore invio ${useWhatsApp ? 'WhatsApp' : 'email'}: ${result.error}` },
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
        guestCheckIns: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    }

    // Recupera la preferenza di contatto
    const guestCheckIn = booking.guestCheckIns?.[0]
    const contactPreference = guestCheckIn?.contactPreference || 'email'

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
      hasPhone: !!booking.guestPhone,
      guestPhone: booking.guestPhone,
      contactPreference,
    })
  } catch (error) {
    console.error('Errore nel recupero messaggi:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero messaggi' },
      { status: 500 }
    )
  }
}
