import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkTemplateApprovalStatus } from '@/lib/twilio-templates'

// POST - Controlla e aggiorna lo stato di approvazione del template
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

    // Trova il messaggio
    const message = await prisma.roomMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
    }

    if (!message.twilioContentSid) {
      return NextResponse.json({ error: 'Nessun template associato' }, { status: 400 })
    }

    // Controlla lo stato su Twilio
    const statusResult = await checkTemplateApprovalStatus(message.twilioContentSid)

    if (!statusResult.success) {
      return NextResponse.json(
        { error: statusResult.error || 'Errore nel controllo stato' },
        { status: 500 }
      )
    }

    // Aggiorna il database se lo stato è cambiato
    if (statusResult.status !== message.twilioApprovalStatus) {
      await prisma.roomMessage.update({
        where: { id: messageId },
        data: { twilioApprovalStatus: statusResult.status },
      })
    }

    return NextResponse.json({
      success: true,
      status: statusResult.status,
      rejectionReason: statusResult.rejectionReason,
    })

  } catch (error) {
    console.error('Errore nel controllo approvazione:', error)
    return NextResponse.json(
      { error: 'Errore nel controllo approvazione' },
      { status: 500 }
    )
  }
}
