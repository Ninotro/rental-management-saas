import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, replaceTemplateVariables, textToHtml } from '@/lib/email'
import { sendWhatsAppTemplateMessage, convertVariablesToTwilioFormat } from '@/lib/twilio-templates'

// Tipo per i risultati
interface SendResult {
  bookingId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  channel: 'EMAIL' | 'WHATSAPP'
  status: 'sent' | 'skipped' | 'failed'
  reason?: string
}

// POST - Invia messaggi di check-in (Email + WhatsApp) a chi ha il check-in tra X giorni
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const daysBeforeCheckin = body.daysBeforeCheckin || 2

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBeforeCheckin)

    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)

    // Trova tutte le prenotazioni con check-in nella data target.
    // Includiamo ora templates di tutti i canali (EMAIL/WHATSAPP/BOTH).
    // Non filtriamo più su guestEmail: serviranno guestEmail O guestPhone.
    const bookings = await prisma.booking.findMany({
      where: {
        checkIn: {
          gte: targetDate,
          lte: targetDateEnd,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      include: {
        property: true,
        room: {
          include: {
            messages: {
              where: {
                type: 'CHECK_IN_INSTRUCTIONS',
                isActive: true,
              },
            },
          },
        },
        bookingRooms: {
          include: {
            room: {
              include: {
                messages: {
                  where: {
                    type: 'CHECK_IN_INSTRUCTIONS',
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        sentMessages: true,
        guestCheckIns: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    })

    const results: SendResult[] = []

    for (const booking of bookings) {
      const hasEmail = !!booking.guestEmail && booking.guestEmail.trim() !== ''
      const hasPhone = !!booking.guestPhone && booking.guestPhone.trim() !== ''

      if (!hasEmail && !hasPhone) {
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: '',
          channel: 'EMAIL',
          status: 'skipped',
          reason: 'Nessun contatto (email o telefono) disponibile',
        })
        continue
      }

      // Trova il template di check-in (bookingRooms ha priorità, fallback su room)
      let message: any = null
      let roomName = ''
      if (booking.bookingRooms && booking.bookingRooms.length > 0) {
        for (const br of booking.bookingRooms) {
          if (br.room.messages && br.room.messages.length > 0) {
            message = br.room.messages[0]
            roomName = br.room.name
            break
          }
        }
      } else if (booking.room?.messages && booking.room.messages.length > 0) {
        message = booking.room.messages[0]
        roomName = booking.room.name
      }

      if (!message) {
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail || '',
          channel: 'EMAIL',
          status: 'skipped',
          reason: 'Nessun messaggio check-in configurato',
        })
        continue
      }

      // Già inviato?
      const alreadySent = booking.sentMessages.some(
        (sm) => sm.messageId === message.id && sm.status === 'SENT'
      )
      if (alreadySent) {
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail || '',
          channel: 'EMAIL',
          status: 'skipped',
          reason: 'Messaggio già inviato',
        })
        continue
      }

      // Determina il canale da usare (stessa logica di /api/bookings/[id]/send-message)
      const guestCheckIn = booking.guestCheckIns?.[0]
      const contactPreference = guestCheckIn?.contactPreference || 'email'
      const templateSupportsWhatsApp = message.channel === 'WHATSAPP' || message.channel === 'BOTH'
      const templateSupportsEmail = message.channel === 'EMAIL' || message.channel === 'BOTH'
      const templateApproved = message.twilioApprovalStatus === 'approved'

      let useWhatsApp = false
      let useEmail = false

      if (contactPreference === 'whatsapp' && templateSupportsWhatsApp && templateApproved && hasPhone) {
        useWhatsApp = true
      } else if (templateSupportsEmail && hasEmail) {
        useEmail = true
      } else if (templateSupportsWhatsApp && templateApproved && hasPhone) {
        useWhatsApp = true
      }

      if (!useWhatsApp && !useEmail) {
        const reasons: string[] = []
        if (!hasEmail) reasons.push('no email')
        if (!hasPhone) reasons.push('no telefono')
        if (templateSupportsWhatsApp && !templateApproved) {
          reasons.push(`template WhatsApp non approvato (${message.twilioApprovalStatus || 'mai inviato'})`)
        }
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail || '',
          guestPhone: booking.guestPhone || undefined,
          channel: 'EMAIL',
          status: 'skipped',
          reason: `Nessun canale disponibile: ${reasons.join(', ')}`,
        })
        continue
      }

      // Prepara i dati per il template
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
          address: booking.property.address || '',
          city: booking.property.city,
        },
        room: roomName ? { name: roomName } : null,
      }

      const messageContent = replaceTemplateVariables(message.messageText, bookingData)
      const subject = message.subject
        ? replaceTemplateVariables(message.subject, bookingData)
        : `Istruzioni Check-in - ${booking.property.name}`

      // Crea record SentMessage (PENDING)
      const sentMessage = await prisma.sentMessage.create({
        data: {
          bookingId: booking.id,
          messageId: message.id,
          channel: useWhatsApp ? 'WHATSAPP' : 'EMAIL',
          status: 'PENDING',
          recipientEmail: useEmail ? booking.guestEmail : null,
          recipientPhone: useWhatsApp ? booking.guestPhone : null,
          subject: useEmail ? subject : null,
          messageContent,
        },
      })

      let sendResult: { success: boolean; error?: string }

      if (useWhatsApp) {
        // Costruisci le variabili per il template WhatsApp
        const { variables } = convertVariablesToTwilioFormat(message.messageText)
        const variableValues: Record<string, string> = {}
        Object.entries(variables).forEach(([varName]) => {
          let value = ''
          switch (varName) {
            case 'guest_name': value = booking.guestName; break
            case 'property_name': value = booking.property.name; break
            case 'room_name': value = roomName; break
            case 'check_in_date': value = new Date(booking.checkIn).toLocaleDateString('it-IT'); break
            case 'check_out_date': value = new Date(booking.checkOut).toLocaleDateString('it-IT'); break
            case 'booking_code': value = booking.bookingCode || ''; break
            case 'num_guests': value = booking.guests.toString(); break
            case 'total_price': value = `€ ${Number(booking.totalPrice).toFixed(2)}`; break
            case 'access_codes':
              value = booking.property.accessCodes
                ? Object.entries(booking.property.accessCodes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ')
                : ''
              break
            default: value = ''
          }
          variableValues[varName] = value
        })

        const waResult = await sendWhatsAppTemplateMessage({
          to: booking.guestPhone!,
          contentSid: message.twilioContentSid!,
          variables: variableValues,
        })
        sendResult = { success: waResult.success, error: waResult.error }

        // Pre-configura il chatbot conversation come nel send-message singolo
        if (waResult.success) {
          try {
            const phoneNumber = booking.guestPhone!.startsWith('+')
              ? booking.guestPhone!
              : `+${booking.guestPhone!.replace(/\D/g, '')}`
            const conversation = await prisma.whatsAppConversation.upsert({
              where: { phoneNumber },
              create: { phoneNumber, guestName: booking.guestName, bookingId: booking.id },
              update: { guestName: booking.guestName, bookingId: booking.id },
            })
            await prisma.chatbotSession.upsert({
              where: { conversationId: conversation.id },
              create: {
                conversationId: conversation.id,
                state: 'READY',
                selectedPropertyId: booking.propertyId,
                selectedRoomId: booking.roomId,
                bookingId: booking.id,
                isHandedOff: false,
              },
              update: {
                state: 'READY',
                selectedPropertyId: booking.propertyId,
                selectedRoomId: booking.roomId,
                bookingId: booking.id,
                isHandedOff: false,
                fallbackCount: 0,
              },
            })
          } catch (chatbotErr) {
            console.warn('Bulk send: errore pre-config chatbot', chatbotErr)
          }
        }
      } else {
        sendResult = await sendEmail({
          to: booking.guestEmail!,
          subject,
          html: textToHtml(messageContent),
        })
      }

      // Aggiorna SentMessage
      await prisma.sentMessage.update({
        where: { id: sentMessage.id },
        data: {
          status: sendResult.success ? 'SENT' : 'FAILED',
          sentAt: sendResult.success ? new Date() : null,
          errorMessage: sendResult.error || null,
        },
      })

      results.push({
        bookingId: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail || '',
        guestPhone: booking.guestPhone || undefined,
        channel: useWhatsApp ? 'WHATSAPP' : 'EMAIL',
        status: sendResult.success ? 'sent' : 'failed',
        reason: sendResult.error,
      })
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const skipped = results.filter((r) => r.status === 'skipped').length
    const failed = results.filter((r) => r.status === 'failed').length
    const sentEmail = results.filter((r) => r.status === 'sent' && r.channel === 'EMAIL').length
    const sentWhatsApp = results.filter((r) => r.status === 'sent' && r.channel === 'WHATSAPP').length

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent,
        sentEmail,
        sentWhatsApp,
        skipped,
        failed,
        targetDate: targetDate.toISOString().split('T')[0],
      },
      results,
    })
  } catch (error: unknown) {
    console.error('Errore invio check-in:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'invio'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET - Anteprima delle prenotazioni che riceveranno il check-in
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysBeforeCheckin = parseInt(searchParams.get('days') || '2')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBeforeCheckin)

    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)

    const bookings = await prisma.booking.findMany({
      where: {
        checkIn: {
          gte: targetDate,
          lte: targetDateEnd,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      include: {
        property: true,
        room: {
          include: {
            messages: {
              where: {
                type: 'CHECK_IN_INSTRUCTIONS',
                isActive: true,
              },
            },
          },
        },
        bookingRooms: {
          include: {
            room: {
              include: {
                messages: {
                  where: {
                    type: 'CHECK_IN_INSTRUCTIONS',
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        sentMessages: {
          where: {
            message: {
              type: 'CHECK_IN_INSTRUCTIONS',
            },
          },
        },
        guestCheckIns: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    })

    const preview = bookings.map((booking) => {
      let template: any = null
      let roomName = ''
      if (booking.bookingRooms && booking.bookingRooms.length > 0) {
        for (const br of booking.bookingRooms) {
          if (br.room.messages && br.room.messages.length > 0) {
            template = br.room.messages[0]
            roomName = br.room.name
            break
          }
        }
      } else if (booking.room?.messages && booking.room.messages.length > 0) {
        template = booking.room.messages[0]
        roomName = booking.room.name
      }

      const hasEmail = !!booking.guestEmail && booking.guestEmail.trim() !== ''
      const hasPhone = !!booking.guestPhone && booking.guestPhone.trim() !== ''
      const alreadySent = booking.sentMessages.some((sm) => sm.status === 'SENT')

      const guestCheckIn = booking.guestCheckIns?.[0]
      const contactPreference = guestCheckIn?.contactPreference || 'email'

      const templateSupportsWhatsApp = template ? (template.channel === 'WHATSAPP' || template.channel === 'BOTH') : false
      const templateSupportsEmail = template ? (template.channel === 'EMAIL' || template.channel === 'BOTH') : false
      const templateApproved = template ? template.twilioApprovalStatus === 'approved' : false

      let plannedChannel: 'EMAIL' | 'WHATSAPP' | null = null
      if (contactPreference === 'whatsapp' && templateSupportsWhatsApp && templateApproved && hasPhone) {
        plannedChannel = 'WHATSAPP'
      } else if (templateSupportsEmail && hasEmail) {
        plannedChannel = 'EMAIL'
      } else if (templateSupportsWhatsApp && templateApproved && hasPhone) {
        plannedChannel = 'WHATSAPP'
      }

      return {
        id: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail || 'Nessuna email',
        guestPhone: booking.guestPhone || null,
        property: booking.property.name,
        room: roomName || 'N/A',
        checkIn: booking.checkIn,
        hasEmail,
        hasPhone,
        hasCheckinMessage: !!template,
        templateApproved,
        contactPreference,
        plannedChannel,
        alreadySent,
        willReceive: !!plannedChannel && !alreadySent,
      }
    })

    const willReceiveCount = preview.filter((p) => p.willReceive).length
    const willReceiveEmail = preview.filter((p) => p.willReceive && p.plannedChannel === 'EMAIL').length
    const willReceiveWhatsApp = preview.filter((p) => p.willReceive && p.plannedChannel === 'WHATSAPP').length

    return NextResponse.json({
      targetDate: targetDate.toISOString().split('T')[0],
      daysBeforeCheckin,
      total: preview.length,
      willReceive: willReceiveCount,
      willReceiveEmail,
      willReceiveWhatsApp,
      bookings: preview,
    })
  } catch (error: unknown) {
    console.error('Errore preview invio check-in:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore durante il recupero'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
