import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST - Upload documento identità (pubblico, no auth)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file caricato' },
        { status: 400 }
      )
    }

    // Validazione tipo file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo file non valido. Usa JPG, PNG, WEBP o PDF' },
        { status: 400 }
      )
    }

    // Validazione dimensione file (max 10MB per documenti)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 10MB' },
        { status: 400 }
      )
    }

    // Crea cartella uploads/documents se non esiste
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Genera nome file univoco
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Salva file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Ritorna URL del file
    const fileUrl = `/uploads/documents/${filename}`

    return NextResponse.json(
      {
        success: true,
        url: fileUrl,
        filename,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Errore upload documento:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload del file' },
      { status: 500 }
    )
  }
}
