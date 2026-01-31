import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PATCH - Set image as primary
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id, imageId } = await params

    // First, unset all other images as primary for this room
    await prisma.roomImage.updateMany({
      where: { roomId: id },
      data: { isPrimary: false },
    })

    // Then set this image as primary
    const image = await prisma.roomImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Errore nell\'impostazione immagine principale:', error)
    return NextResponse.json(
      { error: 'Errore nell\'impostazione immagine principale' },
      { status: 500 }
    )
  }
}
