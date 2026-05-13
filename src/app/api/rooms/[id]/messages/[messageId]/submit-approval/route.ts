import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { submitTemplateForApproval, checkTemplateApprovalStatus } from '@/lib/twilio-templates'

// POST - (Ri)invia il template per approvazione WhatsApp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { messageId } = await params

    const message = await prisma.roomMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
    }

    if (!message.twilioContentSid) {
      return NextResponse.json(
        { error: 'Nessun template Twilio associato. Modifica il messaggio per crearne uno.' },
        { status: 400 }
      )
    }

    const submitResult = await submitTemplateForApproval(message.twilioContentSid)

    // "Already submitted" = il template è già in approvazione su Twilio, il nostro DB è solo out-of-sync.
    // Trattiamolo come successo e sincronizziamo lo stato reale.
    const alreadySubmitted = !submitResult.success &&
      typeof submitResult.error === 'string' &&
      /already been submitted/i.test(submitResult.error)

    if (!submitResult.success && !alreadySubmitted) {
      return NextResponse.json(
        { error: submitResult.error || 'Errore invio per approvazione' },
        { status: 500 }
      )
    }

    // Dopo il submit (o se già sottomesso), controlla lo stato reale su Twilio
    const statusResult = await checkTemplateApprovalStatus(message.twilioContentSid)
    const newStatus = statusResult.success ? (statusResult.status || 'pending') : 'pending'

    await prisma.roomMessage.update({
      where: { id: messageId },
      data: { twilioApprovalStatus: newStatus },
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      synced: alreadySubmitted,
      message: alreadySubmitted
        ? `Template già sottomesso a Twilio. Stato reale sincronizzato: ${newStatus}`
        : 'Template inviato per approvazione WhatsApp',
    })
  } catch (error) {
    console.error('Errore submit-approval:', error)
    return NextResponse.json(
      { error: 'Errore nel reinvio per approvazione' },
      { status: 500 }
    )
  }
}
