import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createWhatsAppTemplate,
  submitTemplateForApproval,
  convertVariablesToTwilioFormat
} from '@/lib/twilio-templates'

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
    const {
      type,
      name,
      subject,
      messageText,
      isActive,
      trigger,
      triggerOffsetHours,
      channel,
      sendTime
    } = body

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

    // Se il canale include WhatsApp, crea il template su Twilio
    let twilioContentSid: string | null = null
    let twilioApprovalStatus: string | null = null
    let twilioVariables: Record<string, number> | null = null

    const selectedChannel = channel || 'EMAIL'

    if (selectedChannel === 'WHATSAPP' || selectedChannel === 'BOTH') {
      // Crea il template su Twilio Content API
      const templateResult = await createWhatsAppTemplate({
        name: name,
        body: messageText,
      })

      if (templateResult.success && templateResult.contentSid) {
        twilioContentSid = templateResult.contentSid

        // Invia per approvazione WhatsApp
        const approvalResult = await submitTemplateForApproval(templateResult.contentSid)
        twilioApprovalStatus = approvalResult.success ? 'pending' : 'error'

        // Salva la mappa delle variabili
        const { variables } = convertVariablesToTwilioFormat(messageText)
        twilioVariables = variables
      } else {
        console.error('Errore creazione template Twilio:', templateResult.error)
        // Non blocchiamo la creazione, ma segnaliamo l'errore
        twilioApprovalStatus = 'error'
      }
    }

    const message = await prisma.roomMessage.create({
      data: {
        roomId,
        type: type || 'CHECK_IN_INSTRUCTIONS',
        name,
        subject: subject || null,
        messageText,
        isActive: isActive !== false,
        trigger: trigger || 'MANUAL',
        triggerOffsetHours: triggerOffsetHours || 0,
        channel: selectedChannel,
        sendTime: sendTime || null,
        twilioContentSid,
        twilioApprovalStatus,
        twilioVariables: twilioVariables ?? undefined,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message,
        templateCreated: !!twilioContentSid,
        templateStatus: twilioApprovalStatus,
      },
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
