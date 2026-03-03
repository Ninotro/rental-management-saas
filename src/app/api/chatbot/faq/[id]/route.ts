import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Dettaglio singola FAQ
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    const faq = await prisma.chatbotFAQ.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        }
      }
    })

    if (!faq) {
      return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 })
    }

    return NextResponse.json(faq)
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della FAQ' },
      { status: 500 }
    )
  }
}

// PATCH - Modifica FAQ
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verifica che la FAQ esista
    const existingFaq = await prisma.chatbotFAQ.findUnique({
      where: { id }
    })

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 })
    }

    // Estrai i campi modificabili
    const {
      propertyId,
      roomId,
      category,
      keywords,
      question,
      answer,
      priority,
      isActive
    } = body

    // Se e' specificato un roomId, verifica che appartenga alla property
    const finalPropertyId = propertyId !== undefined ? propertyId : existingFaq.propertyId
    if (roomId && finalPropertyId) {
      const room = await prisma.room.findFirst({
        where: { id: roomId, propertyId: finalPropertyId }
      })
      if (!room) {
        return NextResponse.json(
          { error: 'La stanza non appartiene alla proprieta\' specificata' },
          { status: 400 }
        )
      }
    }

    // Costruisci l'oggetto di aggiornamento
    const updateData: Record<string, unknown> = {}

    if (propertyId !== undefined) updateData.propertyId = propertyId || null
    if (roomId !== undefined) updateData.roomId = roomId || null
    if (category !== undefined) updateData.category = category
    if (keywords !== undefined) {
      if (!Array.isArray(keywords) || keywords.length === 0) {
        return NextResponse.json(
          { error: 'Le keywords devono essere un array non vuoto' },
          { status: 400 }
        )
      }
      updateData.keywords = keywords
    }
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (priority !== undefined) updateData.priority = priority
    if (isActive !== undefined) updateData.isActive = isActive

    const faq = await prisma.chatbotFAQ.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(faq)
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della FAQ' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina FAQ
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    // Verifica che la FAQ esista
    const existingFaq = await prisma.chatbotFAQ.findUnique({
      where: { id }
    })

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 })
    }

    await prisma.chatbotFAQ.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'FAQ eliminata con successo' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della FAQ' },
      { status: 500 }
    )
  }
}
