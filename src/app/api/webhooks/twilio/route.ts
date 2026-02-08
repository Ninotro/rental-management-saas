import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Verifica firma Twilio per sicurezza
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  // Ordina i parametri alfabeticamente e concatenali
  let data = url
  Object.keys(params)
    .sort()
    .forEach(key => {
      data += key + params[key]
    })

  // Calcola HMAC SHA1
  const computed = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')

  return computed === signature
}

// POST - Webhook per messaggi in arrivo e status updates
export async function POST(request: NextRequest) {
  try {
    // Leggi il body come form data
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Verifica firma Twilio (in produzione)
    const signature = request.headers.get('x-twilio-signature') || ''
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (authToken && process.env.NODE_ENV === 'production') {
      const requestUrl = request.url
      const isValid = verifyTwilioSignature(requestUrl, params, signature, authToken)

      if (!isValid) {
        console.warn('Invalid Twilio signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Estrai dati dal webhook
    const {
      MessageSid,
      From,
      To,
      Body,
      MessageStatus,
      NumMedia,
      MediaUrl0,
    } = params

    // A) Status Update (per messaggi outgoing)
    if (MessageStatus && MessageSid) {
      // Mappa status Twilio ai nostri status
      const statusMap: Record<string, string> = {
        'queued': 'QUEUED',
        'sent': 'SENT',
        'delivered': 'DELIVERED',
        'read': 'READ',
        'failed': 'FAILED',
        'undelivered': 'FAILED',
      }

      const newStatus = statusMap[MessageStatus.toLowerCase()] || MessageStatus.toUpperCase()

      // Aggiorna lo status del messaggio
      await prisma.whatsAppMessage.updateMany({
        where: { twilioSid: MessageSid },
        data: { status: newStatus }
      })

      console.log(`[Twilio Webhook] Status update: ${MessageSid} -> ${newStatus}`)
      return NextResponse.json({ status: 'updated' })
    }

    // B) Messaggio in arrivo (incoming)
    if (From && Body) {
      // Normalizza il numero di telefono (rimuovi prefisso whatsapp:)
      const phoneNumber = From.replace('whatsapp:', '')

      console.log(`[Twilio Webhook] Incoming message from ${phoneNumber}: ${Body}`)

      // Cerca o crea la conversazione
      let conversation = await prisma.whatsAppConversation.findUnique({
        where: { phoneNumber }
      })

      if (!conversation) {
        // Cerca se c'è un booking con questo numero di telefono
        const booking = await prisma.booking.findFirst({
          where: {
            guestPhone: {
              contains: phoneNumber.slice(-10) // Ultimi 10 digit per matching flessibile
            }
          },
          orderBy: { checkIn: 'desc' }
        })

        // Cerca anche nei check-in
        const guestCheckIn = await prisma.guestCheckIn.findFirst({
          where: {
            phone: {
              contains: phoneNumber.slice(-10)
            }
          },
          orderBy: { submittedAt: 'desc' }
        })

        // Determina il nome dell'ospite
        let guestName = null
        let bookingId = null

        if (booking) {
          guestName = booking.guestName
          bookingId = booking.id
        } else if (guestCheckIn) {
          guestName = `${guestCheckIn.firstName} ${guestCheckIn.lastName}`
          bookingId = guestCheckIn.bookingId
        }

        // Crea nuova conversazione
        conversation = await prisma.whatsAppConversation.create({
          data: {
            phoneNumber,
            guestName,
            bookingId,
            unreadCount: 1,
            lastMessageAt: new Date(),
          }
        })
      } else {
        // Aggiorna conversazione esistente
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            unreadCount: { increment: 1 },
            lastMessageAt: new Date(),
          }
        })
      }

      // Salva il messaggio
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'INCOMING',
          body: Body,
          mediaUrl: NumMedia && parseInt(NumMedia) > 0 ? MediaUrl0 : null,
          twilioSid: MessageSid,
          status: 'RECEIVED',
          sentAt: new Date(),
        }
      })

      console.log(`[Twilio Webhook] Message saved to conversation ${conversation.id}`)
    }

    // Twilio si aspetta una risposta 200 OK
    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Per test/verifica endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio webhook endpoint is active'
  })
}
