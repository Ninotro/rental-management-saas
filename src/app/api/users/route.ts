import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - Ottieni lista utenti
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Solo ADMIN e MANAGER possono vedere la lista utenti
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Errore nel recupero utenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero utenti' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo utente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Solo ADMIN può creare nuovi utenti
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role } = body

    // Validazione
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, nome e ruolo sono richiesti' },
        { status: 400 }
      )
    }

    // Verifica se l'email esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      )
    }

    // Hash della password
    const hashedPassword = await hash(password, 12)

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione utente:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione utente' },
      { status: 500 }
    )
  }
}
