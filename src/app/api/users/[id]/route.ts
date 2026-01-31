import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// GET - Ottieni dettagli utente
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Gli utenti possono vedere solo i propri dati, ADMIN e MANAGER possono vedere tutti
    if (
      session.user.id !== user.id &&
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.MANAGER
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Errore nel recupero utente:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero utente' },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna utente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email, password, name, role, active } = body

    // Solo ADMIN può modificare altri utenti
    if (session.user.id !== id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Solo ADMIN può modificare il ruolo e lo stato active
    if ((role !== undefined || active !== undefined) && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Solo gli amministratori possono modificare ruolo e stato' },
        { status: 403 }
      )
    }

    const updateData: any = {}

    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (active !== undefined) updateData.active = active
    if (password) {
      updateData.password = await hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Errore nell\'aggiornamento utente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento utente' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina utente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    // Solo ADMIN può eliminare utenti
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Non permettere di eliminare se stesso
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo account' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Utente eliminato con successo' })
  } catch (error) {
    console.error('Errore nell\'eliminazione utente:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione utente' },
      { status: 500 }
    )
  }
}
