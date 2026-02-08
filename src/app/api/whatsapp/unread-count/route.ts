import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Ottieni conteggio totale messaggi non letti
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Somma tutti gli unreadCount delle conversazioni
    const result = await prisma.whatsAppConversation.aggregate({
      _sum: {
        unreadCount: true
      }
    })

    const count = result._sum.unreadCount || 0

    return NextResponse.json({ count })

  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero conteggio' },
      { status: 500 }
    )
  }
}
