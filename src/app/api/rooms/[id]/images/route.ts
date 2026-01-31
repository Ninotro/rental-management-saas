import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { uploadImage, deleteImage } from '@/lib/cloudinary'

// GET - Ottieni immagini della stanza
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
    const images = await prisma.roomImage.findMany({
      where: { roomId: id },
      orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Errore nel recupero immagini:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero immagini' },
      { status: 500 }
    )
  }
}

// POST - Upload immagine stanza su Cloudinary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }

    // Verifica tipo file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 })
    }

    // Converti file in Buffer per Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload su Cloudinary
    const cloudinaryResult = await uploadImage(buffer, 'rooms')

    // Salva riferimento nel database
    const isPrimary = formData.get('isPrimary') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    // Se è immagine primaria, rimuovi primary dalle altre
    if (isPrimary) {
      await prisma.roomImage.updateMany({
        where: { roomId: id },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.roomImage.create({
      data: {
        roomId: id,
        url: cloudinaryResult.secure_url,
        filename: cloudinaryResult.public_id, // Salva public_id per eliminazione
        isPrimary,
        order,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error: any) {
    console.error('Errore nell\'upload immagine:', error)
    return NextResponse.json(
      { error: error.message || 'Errore nell\'upload immagine' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina immagine da Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'ID immagine richiesto' }, { status: 400 })
    }

    const image = await prisma.roomImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Immagine non trovata' }, { status: 404 })
    }

    // Elimina da Cloudinary (filename contiene il public_id)
    try {
      await deleteImage(image.filename)
    } catch (err) {
      console.error('Errore eliminazione da Cloudinary:', err)
      // Continua comunque con l'eliminazione dal database
    }

    // Elimina da database
    await prisma.roomImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ message: 'Immagine eliminata con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione immagine:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione immagine' },
      { status: 500 }
    )
  }
}
