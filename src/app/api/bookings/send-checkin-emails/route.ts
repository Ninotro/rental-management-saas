import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, replaceTemplateVariables, textToHtml } from '@/lib/email'

// Tipo per i risultati
interface SendResult {
  bookingId: string
  guestName: string
  guestEmail: string
  status: 'sent' | 'skipped' | 'failed'
  reason?: string
}

// POST - Invia email di check-in a chi ha il check-in tra X giorni
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const daysBeforeCheckin = body.daysBeforeCheckin || 2

    // Calcola la data target (tra X giorni)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBeforeCheckin)

    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)

    // Trova tutte le prenotazioni con check-in nella data target
    const bookings = await prisma.booking.findMany({
      where: {
        checkIn: {
          gte: targetDate,
          lte: targetDateEnd,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
        guestEmail: {
          not: '',
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
                channel: {
                  in: ['EMAIL', 'BOTH'],
                },
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
                    channel: {
                      in: ['EMAIL', 'BOTH'],
                    },
                  },
                },
              },
            },
          },
        },
        sentMessages: true,
      },
    })

    const results: SendResult[] = []

    for (const booking of bookings) {
      // Salta se non ha email valida
      if (!booking.guestEmail || booking.guestEmail.trim() === '') {
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: '',
          status: 'skipped',
          reason: 'Nessuna email',
        })
        continue
      }

      // Trova il messaggio di check-in da inviare
      // Prima controlla bookingRooms (nuovo sistema), poi room (legacy)
      let message: { id: string; messageText: string; subject: string | null } | null = null
      let roomName = ''

      if (booking.bookingRooms && booking.bookingRooms.length > 0) {
        // Usa il primo room con un messaggio di check-in
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
          guestEmail: booking.guestEmail,
          status: 'skipped',
          reason: 'Nessun messaggio check-in configurato',
        })
        continue
      }

      // Verifica se il messaggio è già stato inviato
      const alreadySent = booking.sentMessages.some(
        (sm) => sm.messageId === message!.id && sm.status === 'SENT'
      )

      if (alreadySent) {
        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          status: 'skipped',
          reason: 'Messaggio già inviato',
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

      // Sostituisci le variabili nel messaggio
      const messageContent = replaceTemplateVariables(message.messageText, bookingData)
      const subject = message.subject
        ? replaceTemplateVariables(message.subject, bookingData)
        : `Istruzioni Check-in - ${booking.property.name}`

      // Crea il record del messaggio inviato (PENDING)
      const sentMessage = await prisma.sentMessage.create({
        data: {
          bookingId: booking.id,
          messageId: message.id,
          channel: 'EMAIL',
          status: 'PENDING',
          recipientEmail: booking.guestEmail,
          subject,
          messageContent,
        },
      })

      // Invia l'email
      const emailResult = await sendEmail({
        to: booking.guestEmail,
        subject,
        html: textToHtml(messageContent),
      })

      if (emailResult.success) {
        await prisma.sentMessage.update({
          where: { id: sentMessage.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        })

        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          status: 'sent',
        })
      } else {
        await prisma.sentMessage.update({
          where: { id: sentMessage.id },
          data: {
            status: 'FAILED',
            errorMessage: emailResult.error,
          },
        })

        results.push({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          status: 'failed',
          reason: emailResult.error,
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const skipped = results.filter((r) => r.status === 'skipped').length
    const failed = results.filter((r) => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent,
        skipped,
        failed,
        targetDate: targetDate.toISOString().split('T')[0],
      },
      results,
    })
  } catch (error: unknown) {
    console.error('Errore invio email check-in:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'invio delle email'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET - Anteprima delle prenotazioni che riceveranno l'email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysBeforeCheckin = parseInt(searchParams.get('days') || '2')

    // Calcola la data target
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBeforeCheckin)

    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)

    // Trova tutte le prenotazioni con check-in nella data target
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
                channel: {
                  in: ['EMAIL', 'BOTH'],
                },
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
                    channel: {
                      in: ['EMAIL', 'BOTH'],
                    },
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
      },
    })

    const preview = bookings.map((booking) => {
      // Verifica se ha un messaggio di check-in configurato
      let hasCheckinMessage = false
      let roomName = ''

      if (booking.bookingRooms && booking.bookingRooms.length > 0) {
        for (const br of booking.bookingRooms) {
          if (br.room.messages && br.room.messages.length > 0) {
            hasCheckinMessage = true
            roomName = br.room.name
            break
          }
        }
      } else if (booking.room?.messages && booking.room.messages.length > 0) {
        hasCheckinMessage = true
        roomName = booking.room.name
      }

      // Verifica se il messaggio è già stato inviato
      const alreadySent = booking.sentMessages.some((sm) => sm.status === 'SENT')

      return {
        id: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail || 'Nessuna email',
        property: booking.property.name,
        room: roomName || 'N/A',
        checkIn: booking.checkIn,
        hasEmail: !!booking.guestEmail && booking.guestEmail.trim() !== '',
        hasCheckinMessage,
        alreadySent,
        willReceive: !!booking.guestEmail && booking.guestEmail.trim() !== '' && hasCheckinMessage && !alreadySent,
      }
    })

    const willReceiveCount = preview.filter((p) => p.willReceive).length

    return NextResponse.json({
      targetDate: targetDate.toISOString().split('T')[0],
      daysBeforeCheckin,
      total: preview.length,
      willReceive: willReceiveCount,
      bookings: preview,
    })
  } catch (error: unknown) {
    console.error('Errore preview email check-in:', error)
    const errorMessage = error instanceof Error ? error.message : 'Errore durante il recupero dei dati'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
