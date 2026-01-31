import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    })

    return NextResponse.json({
      success: true,
      userCount,
      users,
      dbUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET!',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      dbUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET!',
    }, { status: 500 })
  }
}
