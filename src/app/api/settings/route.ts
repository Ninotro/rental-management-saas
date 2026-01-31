import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
    try {
        const settings = await prisma.globalSettings.findUnique({
            where: { id: 'singleton' }
        })

        if (!settings) {
            const defaultSettings = await prisma.globalSettings.create({
                data: { id: 'singleton' }
            })
            return NextResponse.json(defaultSettings)
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Errore nel recupero impostazioni:', error)
        return NextResponse.json({ error: 'Errore nel recupero impostazioni' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any).role === 'STAFF') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        const body = await request.json()
        // Filtriamo i campi che non vogliamo siano aggiornabili o che devono essere validati
        const { id, updatedAt, ...updateData } = body

        const settings = await prisma.globalSettings.upsert({
            where: { id: 'singleton' },
            update: updateData,
            create: { ...updateData, id: 'singleton' }
        })

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Errore nell\'aggiornamento impostazioni:', error)
        return NextResponse.json({ error: 'Errore nell\'aggiornamento impostazioni' }, { status: 500 })
    }
}
