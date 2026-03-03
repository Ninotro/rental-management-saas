import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Lista FAQ con filtri opzionali
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    // Costruisci il filtro
    const where: Record<string, unknown> = {}

    if (propertyId) {
      where.propertyId = propertyId
    }
    if (roomId) {
      where.roomId = roomId
    }
    if (category) {
      where.category = category
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const faqs = await prisma.chatbotFAQ.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(faqs)
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle FAQ' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova FAQ
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const {
      propertyId,
      roomId,
      category,
      keywords,
      question,
      answer,
      priority = 0,
      isActive = true
    } = body

    // Validazione
    if (!category || !keywords || !question || !answer) {
      return NextResponse.json(
        { error: 'Categoria, keywords, domanda e risposta sono obbligatori' },
        { status: 400 }
      )
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Le keywords devono essere un array non vuoto' },
        { status: 400 }
      )
    }

    // Se e' specificato un roomId, verifica che appartenga alla property
    if (roomId && propertyId) {
      const room = await prisma.room.findFirst({
        where: { id: roomId, propertyId }
      })
      if (!room) {
        return NextResponse.json(
          { error: 'La stanza non appartiene alla proprieta\' specificata' },
          { status: 400 }
        )
      }
    }

    const faq = await prisma.chatbotFAQ.create({
      data: {
        propertyId: propertyId || null,
        roomId: roomId || null,
        category,
        keywords,
        question,
        answer,
        priority,
        isActive
      },
      include: {
        property: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(faq, { status: 201 })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione della FAQ' },
      { status: 500 }
    )
  }
}
