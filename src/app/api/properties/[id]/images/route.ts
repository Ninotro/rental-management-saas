import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// GET - Ottieni immagini della proprietà
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
    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
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

// POST - Upload immagine
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

    // Crea cartella upload se non esiste
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'properties')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Genera nome file unico
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filepath = path.join(uploadDir, filename)

    // Salva file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Salva riferimento nel database
    const isPrimary = formData.get('isPrimary') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    // Se è immagine primaria, rimuovi primary dalle altre
    if (isPrimary) {
      await prisma.propertyImage.updateMany({
        where: { propertyId: id },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.propertyImage.create({
      data: {
        propertyId: id,
        url: `/uploads/properties/${filename}`,
        filename,
        isPrimary,
        order,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Errore nell\'upload immagine:', error)
    return NextResponse.json(
      { error: 'Errore nell\'upload immagine' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina immagine
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

    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Immagine non trovata' }, { status: 404 })
    }

    // Elimina file dal filesystem
    const filepath = path.join(process.cwd(), 'public', image.url)
    try {
      const fs = await import('fs/promises')
      await fs.unlink(filepath)
    } catch (err) {
      console.error('Errore eliminazione file:', err)
    }

    // Elimina da database
    await prisma.propertyImage.delete({
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
