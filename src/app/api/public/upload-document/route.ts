import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

// POST - Upload documento identità (pubblico, no auth) - usa Cloudinary
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

    // Converti file in buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload su Cloudinary nella cartella documents
    const result = await uploadImage(buffer, 'documents')

    return NextResponse.json(
      {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
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
