import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Prenotazioni totali (questo mese)
    const totalBookingsThisMonth = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    // Prenotazioni mese scorso (per calcolo %)
    const totalBookingsLastMonth = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    })

    // Ricavi totali questo mese
    const revenueThisMonth = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    // Ricavi mese scorso
    const revenueLastMonth = await prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    })

    // Strutture attive
    const totalProperties = await prisma.property.count({
      where: { active: true },
    })

    // Check-in prossimi 7 giorni
    const upcomingCheckIns = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { gte: today, lte: nextWeek },
      },
    })

    // Check-in di oggi
    const checkInsToday = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        checkIn: { gte: today, lt: tomorrow },
      },
    })

    // Prenotazioni recenti (ultime 5)
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      },
      include: {
        property: { select: { name: true } },
        room: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Calcola variazioni percentuali
    const bookingsChange = totalBookingsLastMonth > 0
      ? Math.round(((totalBookingsThisMonth - totalBookingsLastMonth) / totalBookingsLastMonth) * 100)
      : totalBookingsThisMonth > 0 ? 100 : 0

    const revenueThisMonthVal = Number(revenueThisMonth._sum.totalPrice) || 0
    const revenueLastMonthVal = Number(revenueLastMonth._sum.totalPrice) || 0
    const revenueChange = revenueLastMonthVal > 0
      ? Math.round(((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100)
      : revenueThisMonthVal > 0 ? 100 : 0

    return NextResponse.json({
      totalBookings: totalBookingsThisMonth,
      bookingsChange,
      totalRevenue: revenueThisMonthVal,
      revenueChange,
      totalProperties,
      upcomingCheckIns,
      checkInsToday,
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        guestName: b.guestName,
        propertyName: b.property.name,
        roomName: b.room?.name,
        totalPrice: b.totalPrice,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
      })),
    })
  } catch (error) {
    console.error('Errore nel recupero statistiche dashboard:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero statistiche' },
      { status: 500 }
    )
  }
}
