import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createWhatsAppTemplate,
  submitTemplateForApproval,
  deleteWhatsAppTemplate,
  convertVariablesToTwilioFormat
} from '@/lib/twilio-templates'

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
    const {
      name,
      subject,
      messageText,
      isActive,
      trigger,
      triggerOffsetHours,
      channel,
      sendTime
    } = body

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

    const newChannel = channel || existingMessage.channel
    const oldChannel = existingMessage.channel
    const textChanged = messageText !== existingMessage.messageText
    const nameChanged = name !== existingMessage.name

    // Gestione template Twilio
    let twilioContentSid = existingMessage.twilioContentSid
    let twilioApprovalStatus = existingMessage.twilioApprovalStatus
    let twilioVariables = existingMessage.twilioVariables as Record<string, number> | null

    // Caso 1: Da EMAIL a WHATSAPP/BOTH - Creare nuovo template
    const needsNewTemplate =
      (oldChannel === 'EMAIL' && (newChannel === 'WHATSAPP' || newChannel === 'BOTH')) ||
      // Caso 2: Era già WHATSAPP/BOTH e il testo o nome è cambiato - Ricreare template
      ((oldChannel === 'WHATSAPP' || oldChannel === 'BOTH') &&
       (newChannel === 'WHATSAPP' || newChannel === 'BOTH') &&
       (textChanged || nameChanged))

    // Caso 3: Da WHATSAPP/BOTH a EMAIL - Eliminare template
    const needsDeleteTemplate =
      (oldChannel === 'WHATSAPP' || oldChannel === 'BOTH') &&
      newChannel === 'EMAIL'

    // Elimina vecchio template se necessario
    if ((needsNewTemplate || needsDeleteTemplate) && existingMessage.twilioContentSid) {
      console.log('Eliminando vecchio template:', existingMessage.twilioContentSid)
      await deleteWhatsAppTemplate(existingMessage.twilioContentSid)

      if (needsDeleteTemplate) {
        twilioContentSid = null
        twilioApprovalStatus = null
        twilioVariables = null
      }
    }

    // Crea nuovo template se necessario
    if (needsNewTemplate) {
      console.log('Creando nuovo template WhatsApp...')
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
        twilioApprovalStatus = 'error'
      }
    }

    const message = await prisma.roomMessage.update({
      where: { id: messageId },
      data: {
        name,
        subject: subject || null,
        messageText,
        isActive: isActive !== false,
        trigger: trigger || existingMessage.trigger,
        triggerOffsetHours: triggerOffsetHours !== undefined ? triggerOffsetHours : existingMessage.triggerOffsetHours,
        channel: newChannel,
        sendTime: sendTime !== undefined ? sendTime : existingMessage.sendTime,
        twilioContentSid,
        twilioApprovalStatus,
        twilioVariables: twilioVariables ?? undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message,
      templateCreated: needsNewTemplate && !!twilioContentSid,
      templateDeleted: needsDeleteTemplate,
      templateStatus: twilioApprovalStatus,
    })
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

    // Elimina il template Twilio se esiste
    if (existingMessage.twilioContentSid) {
      console.log('Eliminando template Twilio:', existingMessage.twilioContentSid)
      await deleteWhatsAppTemplate(existingMessage.twilioContentSid)
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
