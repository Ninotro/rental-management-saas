import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - Suggerisci prenotazioni per un check-in pending
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params

    // Trova il check-in
    const checkIn = await prisma.guestCheckIn.findUnique({
      where: { id },
      include: {
        selectedRoom: {
          include: {
            property: { select: { name: true } },
          },
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in non trovato' },
        { status: 404 }
      )
    }

    // Cerca prenotazioni che potrebbero matchare
    const suggestions = []

    // 1. Match esatto: stessa stanza, date simili (±2 giorni)
    if (checkIn.selectedRoomId && checkIn.selectedCheckIn) {
      const twoDaysBefore = new Date(checkIn.selectedCheckIn)
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2)
      const twoDaysAfter = new Date(checkIn.selectedCheckIn)
      twoDaysAfter.setDate(twoDaysAfter.getDate() + 2)

      const exactMatches = await prisma.booking.findMany({
        where: {
          roomId: checkIn.selectedRoomId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          checkIn: {
            gte: twoDaysBefore,
            lte: twoDaysAfter,
          },
        },
        include: {
          property: { select: { name: true } },
          room: { select: { name: true } },
        },
        orderBy: { checkIn: 'asc' },
        take: 5,
      })

      for (const booking of exactMatches) {
        suggestions.push({
          ...booking,
          matchType: 'exact',
          matchScore: 100,
          matchReason: 'Stessa stanza e date corrispondenti',
        })
      }
    }

    // 2. Match per nome ospite (se non già trovati)
    if (suggestions.length < 5 && checkIn.firstName && checkIn.lastName) {
      const nameMatches = await prisma.booking.findMany({
        where: {
          guestName: {
            contains: checkIn.lastName,
            mode: 'insensitive',
          },
          status: { in: ['CONFIRMED', 'PENDING'] },
          id: { notIn: suggestions.map(s => s.id) },
        },
        include: {
          property: { select: { name: true } },
          room: { select: { name: true } },
        },
        orderBy: { checkIn: 'desc' },
        take: 5,
      })

      for (const booking of nameMatches) {
        suggestions.push({
          ...booking,
          matchType: 'name',
          matchScore: 70,
          matchReason: `Nome ospite simile: ${booking.guestName}`,
        })
      }
    }

    // 3. Match per date nella stessa proprietà
    if (suggestions.length < 5 && checkIn.selectedRoom?.propertyId && checkIn.selectedCheckIn) {
      const threeDaysBefore = new Date(checkIn.selectedCheckIn)
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3)
      const threeDaysAfter = new Date(checkIn.selectedCheckIn)
      threeDaysAfter.setDate(threeDaysAfter.getDate() + 3)

      const propertyMatches = await prisma.booking.findMany({
        where: {
          propertyId: checkIn.selectedRoom.propertyId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          checkIn: {
            gte: threeDaysBefore,
            lte: threeDaysAfter,
          },
          id: { notIn: suggestions.map(s => s.id) },
        },
        include: {
          property: { select: { name: true } },
          room: { select: { name: true } },
        },
        orderBy: { checkIn: 'asc' },
        take: 5,
      })

      for (const booking of propertyMatches) {
        suggestions.push({
          ...booking,
          matchType: 'property',
          matchScore: 50,
          matchReason: 'Stessa struttura, date simili',
        })
      }
    }

    // Ordina per score
    suggestions.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      checkIn: {
        id: checkIn.id,
        firstName: checkIn.firstName,
        lastName: checkIn.lastName,
        selectedCheckIn: checkIn.selectedCheckIn,
        selectedCheckOut: checkIn.selectedCheckOut,
        selectedRoom: checkIn.selectedRoom,
      },
      suggestions: suggestions.slice(0, 10),
    })
  } catch (error) {
    console.error('Errore nel recupero suggerimenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero suggerimenti' },
      { status: 500 }
    )
  }
}
